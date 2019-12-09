import TaskList from 'listr'
import ncp from 'ncp'
import os from 'os'
import path from 'path'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import chalk from 'chalk'
import fs from 'fs'
import ethers from 'ethers'
import { promisify } from 'util'
import ganache from 'ganache-cli'
//
import listrOpts from '../../helpers/listr-options'
import pjson from '../../package.json'
import devchainStatus from './status'
import { BLOCK_GAS_LIMIT, MNEMONIC } from './utils/ganache-vars'

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
      alias: 'v',
    })
}

export const task = async function({
  port = 8545,
  networkId,
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
    `.aragon/aragen-db-${pjson.version}`
  )

  const tasks = new TaskList(
    [
      {
        title: 'Check devchain status',
        task: async ctx => {
          const task = await devchainStatus.task({
            port,
            reset,
            silent,
            debug,
          })

          const { portTaken, processID } = await task.run()

          if (portTaken && !reset) {
            throw new Error(
              `Process with ID ${chalk.red(
                processID
              )} already running at port ${chalk.blue(port)}`
            )
          }
        },
      },
      {
        title: 'Setting up a new chain from latest Aragon snapshot',
        task: async (ctx, task) => {
          await removeDir(snapshotPath)
          await mkDir(path.resolve(snapshotPath, '..'))
          const snapshot = path.join(__dirname, '@aragon/aragen/aragon-ganache')
          await recursiveCopy(snapshot, snapshotPath)
        },
        enabled: () => !fs.existsSync(snapshotPath) || reset,
      },
      {
        title: 'Starting a local chain from snapshot',
        task: async (ctx, task) => {
          ctx.id = parseInt(networkId) || parseInt(1e8 * Math.random())

          // TODO: Pass all argv options to ganache server
          const options = {
            network_id: ctx.id,
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

                task.title = `Local chain started at port ${chalk.blue(port)}\n`
                resolve()
              })
            })
          await listen()

          ctx.mnemonic = MNEMONIC

          ctx.wallets = []

          for (let i = 1; i <= showAccounts; i++) {
            const path = `m/44'/60'/0'/0/${i - 1}`
            ctx.wallets.push(ethers.Wallet.fromMnemonic(MNEMONIC, path))
          }
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
}

export const printAccounts = (reporter, wallets) => {
  const firstAccountComment =
    '(account used to deploy DAOs, has more permissions)'

  const formattedAccounts = wallets.map(
    ({ address, privateKey }, i) =>
      `Address #${i + 1}:  ${chalk.green(address)} ${
        i === 0 ? firstAccountComment : ''
      }\nPrivate key: ` +
      chalk.blue(privateKey) +
      '\n'
  )

  reporter.info(`Here are some Ethereum accounts you can use.
  The first one will be used for all the actions the aragonCLI performs.
  You can use your favorite Ethereum provider or wallet to import their private keys.
  \n${formattedAccounts.join('\n')}`)
}

export const printMnemonic = (reporter, mnemonic) => {
  reporter.info(
    `The accounts were generated from the following mnemonic phrase:\n${chalk.blue(
      mnemonic
    )}\n`
  )
}

export const printResetNotice = (reporter, reset) => {
  if (reset) {
    reporter.warning(`${chalk.yellow(
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
  const { wallets, id, mnemonic } = await tasks.run()
  printAccounts(reporter, wallets)
  printMnemonic(reporter, mnemonic)
  printResetNotice(reporter, reset)

  reporter.info(
    'ENS instance deployed at:',
    chalk.green('0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'),
    '\n'
  )

  reporter.info(`Network Id: ${chalk.blue(id)}`, '\n')

  reporter.info(
    `Devchain running at: ${chalk.blue('http://localhost:' + port)}.`
  )
}
