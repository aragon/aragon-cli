const TaskList = require('listr')
const ganache = require('ganache-core')
const Web3 = require('web3')
const { BLOCK_GAS_LIMIT, MNEMONIC } = require('../helpers/ganache-vars')

exports.command = 'devchain'

exports.describe = 'Open a test chain for development and pass arguments to ganache'

exports.builder = {
  port: {
    description: 'The port to run the local chain on',
    default: 8545
  }
}

exports.task = async function ({ reporter, cwd, port = 8545 }) {
  const tasks = new TaskList([{
    title: 'Starting a local chain',
    task: async (ctx, task) => {
      const server = ganache.server({
        gasLimit: BLOCK_GAS_LIMIT,
        mnemonic: MNEMONIC
      })
    
      return new Promise((resolve, reject) => {
        server.listen(port, (err) => {
          if (err) return reject(err)
    
          task.title = `Local chain started at :${port}`
          resolve()
        })
      }).then(async () => {
        // Set a temporary provider for deployments
        ctx.web3 = new Web3(
          new Web3.providers.WebsocketProvider(`ws://localhost:${port}`)
        )
    
        // Grab the accounts
        ctx.accounts = await ctx.web3.eth.getAccounts()
      })
    }
  }])

  return tasks.run().then((ctx) => {

  })
}

exports.handler = exports.task