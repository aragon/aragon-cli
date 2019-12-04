const TaskList = require('listr')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const exec = require('../../../lib/dao/exec')

/**
 * Return a task list for executing a method on a
 * DAO's app.
 *
 * @param {Object} params Parameters
 * @param {string} params.dao DAO name or address
 * @param {string} params.app App address
 * @param {string} params.method Method name
 * @param {Array<*>} params.params Method parameters
 * @param {boolean} params.ipfsCheck Check if IPFS is running
 * @param {Object} params.apm APM config
 * @param {Object} params.web3 Web3 instance
 * @param {string} params.gasPrice Gas price
 * @param {boolean} params.silent Silent task
 * @param {boolean} params.debug Debug mode
 * @returns {Promise<TaskList>} Execution task list
 */
async function task({
  dao,
  app,
  method,
  params,
  ipfsCheck,
  apm,
  web3,
  gasPrice,
  silent,
  debug,
}) {
  return new TaskList(
    [
      {
        title: `Executing ${method} on ${dao}`,
        task: async (ctx, task) => {
          task.output = `Check IPFS`

          const progressHandler = progress => {
            switch (progress) {
              case 1:
                task.output = `Generating transaction`
                break
              case 2:
                task.output = `Sending transaction`
                break
            }
          }

          Object.assign(
            ctx,
            await exec({
              dao,
              apm,
              app,
              method,
              params,
              web3,
              gasPrice,
              ipfsCheck,
              progressHandler,
            })
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

module.exports = { task }
