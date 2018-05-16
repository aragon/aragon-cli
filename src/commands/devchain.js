const TaskList = require('listr')
const ncp = require('ncp')
const ganache = require('ganache-core')
const Web3 = require('web3')
const { promisify } = require('util')
const homedir = require('homedir')()
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const chalk = require('chalk')

const { BLOCK_GAS_LIMIT, MNEMONIC } = require('../helpers/ganache-vars')

exports.command = 'devchain'
exports.describe = 'Open a test chain for development and pass arguments to ganache'
exports.builder = {
  port: {
    description: 'The port to run the local chain on',
    default: 8545
  }
}

exports.task = async function ({ port = 8545 }) {
  const removeDir = promisify(rimraf)
  const mkDir = promisify(mkdirp)
  const recursiveCopy = promisify(ncp)

  const snapshotPath = path.join(homedir, '.aragon/ganache-db')

  const tasks = new TaskList([
  {
    title: 'Setting up latest Aragon snapshot',
    task: async (ctx, task) => {
      await removeDir(snapshotPath)
      await mkDir(path.resolve(snapshotPath, '..'))
      const aragen = path.resolve(require.resolve('@aragon/aragen'), '../aragon-ganache')
      await recursiveCopy(aragen, snapshotPath)
    }
  },
  {
    title: 'Starting a local chain from snapshot',
    task: async (ctx, task) => {
      const server = ganache.server({
        gasLimit: BLOCK_GAS_LIMIT,
        mnemonic: MNEMONIC,
        db_path: snapshotPath
      })
      const listen = () => (
        new Promise((resolve, reject) => {
          server.listen(port, (err) => {
            if (err) return reject(err)
      
            task.title = `Local chain started at port ${port}`
            resolve()
          })
        })
      )
      await listen()
      ctx.web3 = new Web3(
        new Web3.providers.WebsocketProvider(`ws://localhost:${port}`)
      )
      ctx.accounts = await ctx.web3.eth.getAccounts()
      ctx.privateKeys = server.provider.manager.state.accounts
    }
  }])

  return tasks.run()
}

exports.handler = async ({ reporter, port }) => {
  const ctx = await exports.task({ port })
  reporter.info(`Here are some accounts you can use.
  The first one will use for all the actions the CLI performs.

  ${Object.keys(ctx.privateKeys).map((address) =>
    chalk.bold(`Address: ${address}\n  Key: `) + ctx.privateKeys[address].secretKey.toString('hex')).join('\n  ')}
  `)
}