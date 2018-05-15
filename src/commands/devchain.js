const TaskList = require('listr')
const ncp = require('ncp')
const ganache = require('ganache-core')
const Web3 = require('web3')
const util = require('util')
const homedir = require('homedir')()
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')

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
  const removeDir = util.promisify(rimraf)
  const mkDir = util.promisify(mkdirp)
  const recursiveCopy = util.promisify(ncp)

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
      return new Promise((resolve, reject) => {
        server.listen(port, (err) => {
          if (err) return reject(err)
    
          task.title = `Local chain started at port ${port}`
          resolve()
        })
      }).then(async () => {
        return new Promise(async (resolve, reject) => {
          ctx.web3 = new Web3(
            new Web3.providers.WebsocketProvider(`ws://localhost:${port}`)
          )
          ctx.accounts = await ctx.web3.eth.getAccounts()
          resolve()
        })
      })
    }
  }])

  return tasks.run().then((ctx) => {
    return ctx
  })
}

exports.handler = exports.task