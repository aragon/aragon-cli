import TaskList from 'listr'
import ncp from 'ncp'
import os from 'os'
import path from 'path'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import fs from 'fs'
import Web3 from 'web3'
import { blue, red, green, yellow } from 'chalk'
import { promisify } from 'util'
import { getAragonGanacheFiles } from '@aragon/toolkit'
//
import ganache from 'ganache-core'
import listrOpts from '../../helpers/listr-options'
import pjson from '../../../package.json'
import { task as devchainStatusTask } from './status'
import { BLOCK_GAS_LIMIT, MNEMONIC } from './utils/constants'

export const command = 'start'
export const describe =
  'Open a test chain for development and pass arguments to ganache'

export const builder = yargs => {
  return yargs
    .option('port', {
      description: 'The port to run the local chain on',
      default: 8545,
      alias: 'p',
    })
    .option('network-id', {
      description: 'Network id to connect with',
      alias: 'i',
    })
    .option('hardfork', {
      description:
        'Allows to specify which hardfork should be used. Supported hardforks are byzantium, constantinople, petersburg, and istanbul (default).',
    })
    .option('block-time', {
      description: 'Specify blockTime in seconds for automatic mining',
      alias: 'b',
    })
    .option('gas-limit', {
      default: BLOCK_GAS_LIMIT,
      description: 'Block gas limit. Must be specified as a hex string',
      alias: 'l',
    })
    .option('reset', {
      type: 'boolean',
      default: false,
      description: 'Reset devchain to snapshot',
      alias: 'r',
    })
    .option('accounts', {
      default: 2,
      description: 'Number of accounts to print',
      alias: 'a',
    })
    .option('verbose', {
      default: false,
      type: 'boolean',
      description: 'Enable verbose devchain output',
    })
}

export const task = async function({
  port = 8545,
  networkId,
  hardfork = 'istanbul',
  blockTime,
  gasLimit = BLOCK_GAS_LIMIT,
  verbose = false,
  reset = false,
  showAccounts = 2,
  reporter,
  silent,
  debug,
}) {
  const removeDir = promisify(rimraf)
  const mkDir = promisify(mkdirp)
  const recursiveCopy = promisify(ncp)

  const snapshotPath = path.join(
    os.homedir(),
    `.aragon/devchain-db-${pjson.version}`
  )

  const tasks = new TaskList(
    [
      {
        title: 'Check devchain status',
        task: async ctx => {
          const task = await devchainStatusTask({
            port,
            reset,
            silent,
            debug,
          })

          const { portTaken, processID } = await task.run()

          if (portTaken && !reset) {
            throw new Error(
              `Process with ID ${red(processID)} already running at port ${blue(
                port
              )}`
            )
          }
        },
      },
      {
        title: 'Setting up a new chain from latest Aragon snapshot',
        task: async (ctx, task) => {
          await removeDir(snapshotPath)
          await mkDir(path.resolve(snapshotPath, '..'))
          const snapshot = getAragonGanacheFiles()
          await recursiveCopy(snapshot, snapshotPath)
        },
        enabled: () => !fs.existsSync(snapshotPath) || reset,
      },
      {
        title: 'Starting a local chain from snapshot',
        task: async (ctx, task) => {
          ctx.id = parseInt(networkId) || parseInt(1e8 * Math.random())

          const options = {
            network_id: ctx.id,
            hardfork,
            blockTime,
            gasLimit,
            mnemonic: MNEMONIC,
            db_path: snapshotPath,
            logger: verbose ? { log: reporter.info.bind(reporter) } : undefined,
            debug,
          }

          const server = ganache.server(options)

          const listen = () =>
            new Promise((resolve, reject) => {
              server.listen(port, err => {
                if (err) return reject(err)

                task.title = `Local chain started at port ${blue(port)}\n`
                resolve()
              })
            })
          await listen()

          // TODO: remove web3 logic
          ctx.web3 = new Web3(
            new Web3.providers.WebsocketProvider(`ws://localhost:${port}`)
          )
          const accounts = await ctx.web3.eth.getAccounts()

          ctx.accounts = accounts.slice(0, parseInt(showAccounts))

          ctx.mnemonic = MNEMONIC

          const ganacheAccounts = server.provider.manager.state.accounts
          ctx.privateKeys = ctx.accounts.map(address => ({
            key: ganacheAccounts[address.toLowerCase()].secretKey.toString(
              'hex'
            ),
            address,
          }))
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
}

export const printAccounts = (reporter, privateKeys) => {
  const firstAccountComment =
    '(account used to deploy DAOs, has more permissions)'

  const formattedAccounts = privateKeys.map(
    ({ address, key }, i) =>
      `Address #${i + 1}:  ${green(address)} ${
        i === 0 ? firstAccountComment : ''
      }\nPrivate key: ` +
      blue(key) +
      '\n'
  )

  reporter.info(`Here are some Ethereum accounts you can use.
  The first one will be used for all the actions the aragonCLI performs.
  You can use your favorite Ethereum provider or wallet to import their private keys.
  \n${formattedAccounts.join('\n')}`)
}

export const printMnemonic = (reporter, mnemonic) => {
  reporter.info(
    `The accounts were generated from the following mnemonic phrase:\n${blue(
      mnemonic
    )}\n`
  )
}

export const printResetNotice = (reporter, reset) => {
  if (reset) {
    reporter.warning(`${yellow(
      'The devchain was reset, some steps need to be done to prevent issues:'
    )}
    - Reset the application cache in Aragon Client by going to Settings -> Troubleshooting.
    - If using Metamask: switch to a different network, and then switch back to the 'Private Network' (this will clear the nonce cache and prevent errors when sending transactions)
  `)
  }
}

export const handler = async ({
  reporter,
  port,
  networkId,
  blockTime,
  gasLimit,
  reset,
  verbose,
  accounts,
  silent,
  debug,
}) => {
  const tasks = await task({
    port,
    networkId,
    blockTime,
    gasLimit,
    reset,
    verbose,
    reporter,
    showAccounts: accounts,
    silent,
    debug,
  })
  const { privateKeys, id, mnemonic } = await tasks.run()
  printAccounts(reporter, privateKeys)
  printMnemonic(reporter, mnemonic)
  printResetNotice(reporter, reset)

  reporter.info(
    'ENS instance deployed at:',
    green('0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'),
    '\n'
  )

  reporter.info(`Network Id: ${blue(id)}`, '\n')

  reporter.info(`Devchain running at: ${blue('http://localhost:' + port)}.`)

  // Patch to prevent calling the onFinishCommand hook
  await new Promise((resolve, reject) => {})
}
