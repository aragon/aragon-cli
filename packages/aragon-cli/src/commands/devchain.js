const TaskList = require('listr')
const ncp = require('ncp')
const ganache = require('ganache-core')
const Web3 = require('web3')
const { promisify } = require('util')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const chalk = require('chalk')
const fs = require('fs')
const listrOpts = require('../helpers/listr-options')

const { BLOCK_GAS_LIMIT, MNEMONIC } = require('../helpers/ganache-vars')

exports.command = 'devchain'
exports.describe =
  'Open a test chain for development and pass arguments to ganache'
exports.builder = {
  port: {
    description: 'The port to run the local chain on',
    default: 8545,
  },
  reset: {
    type: 'boolean',
    default: false,
    description: 'Reset devchain to snapshot',
  },
  accounts: {
    default: 2,
    description: 'Number of accounts to print',
  },
}

exports.task = async function({
  port = 8545,
  reset = false,
  showAccounts = 2,
  silent,
  debug,
}) {
  const removeDir = promisify(rimraf)
  const mkDir = promisify(mkdirp)
  const recursiveCopy = promisify(ncp)

  const snapshotPath = path.join(os.homedir(), `.aragon/ganache-db-${port}`)

  const tasks = new TaskList(
    [
      {
        title: 'Setting up a new chain from latest Aragon snapshot',
        task: async (ctx, task) => {
          await removeDir(snapshotPath)
          await mkDir(path.resolve(snapshotPath, '..'))
          const aragen = path.resolve(
            require.resolve('@aragon/aragen'),
            '../aragon-ganache'
          )
          await recursiveCopy(aragen, snapshotPath)
        },
        enabled: () => !fs.existsSync(snapshotPath) || reset,
      },
      {
        title: 'Starting a local chain from snapshot',
        task: async (ctx, task) => {
          const server = ganache.server({
            // Start on a different networkID every time to avoid Metamask nonce caching issue:
            // https://github.com/aragon/aragon-cli/issues/156
            network_id: parseInt(1e8 * Math.random()),
            gasLimit: BLOCK_GAS_LIMIT,
            mnemonic: MNEMONIC,
            db_path: snapshotPath,
          })
          const listen = () =>
            new Promise((resolve, reject) => {
              server.listen(port, err => {
                if (err) return reject(err)

                task.title = `Local chain started at port ${port}`
                resolve()
              })
            })
          await listen()

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

exports.printAccounts = (reporter, privateKeys) => {
  const firstAccountComment =
    '(this account is used to deploy DAOs, it has more permissions)'

  const formattedAccounts = privateKeys.map(
    ({ address, key }, i) =>
      chalk.bold(
        `Address #${i + 1}:  ${address} ${
          i === 0 ? firstAccountComment : ''
        }\nPrivate key: `
      ) + key
  )

  reporter.info(`Here are some Ethereum accounts you can use.
  The first one will be used for all the actions the CLI performs.
  You can use your favorite Ethereum provider or wallet to import their private keys.
  \n${formattedAccounts.join('\n')}`)
}

exports.printMnemonic = (reporter, mnemonic) => {
  reporter.info(
    `The accounts were generated from the following mnemonic phrase:\n${mnemonic}\n`
  )
}

exports.printResetNotice = (reporter, reset) => {
  if (reset) {
    reporter.warning(`The devchain was reset, some steps need to be done to prevent issues:
    - Reset the application cache in Aragon Core by going to Settings > Troubleshooting.
    - If using Metamask: switch to a different network, and then switch back to the 'Private Network' (this will clear the nonce cache and prevent errors when sending transactions)  
  `)
  }
}

exports.handler = async ({
  reporter,
  port,
  reset,
  accounts,
  apm: apmOptions,
  silent,
  debug,
}) => {
  const task = await exports.task({
    port,
    reset,
    showAccounts: accounts,
    silent,
    debug,
  })
  const { privateKeys, mnemonic } = await task.run()
  exports.printAccounts(reporter, privateKeys)
  exports.printMnemonic(reporter, mnemonic)
  exports.printResetNotice(reporter, reset)

  reporter.info(`ENS instance deployed at ${apmOptions['ens-registry']}\n`)

  reporter.info(`Devchain running: ${chalk.bold('http://localhost:' + port)}.`)
}
