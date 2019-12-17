import TaskList from 'listr'
import { blue } from 'chalk'
import exec from '@aragon/toolkit'
//
import listrOpts from '../../../helpers/listr-options'

/**
 * Return a task list for executing a method on a
 * DAO's app.
 *
 * @param {Object} params Parameters
 * @param {string} params.dao DAO name or address
 * @param {string} params.app App address
 * @param {string} params.method Method name
 * @param {Array<*>} params.params Method parameters
 * @param {Object} params.apm APM config
 * @param {Object} params.web3 Web3 instance
 * @param {string} params.gasPrice Gas price
 * @param {boolean} params.silent Silent task
 * @param {boolean} params.debug Debug mode
 * @returns {Promise<TaskList>} Execution task list
 */
export async function task({
  dao,
  app,
  method,
  params,
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
              progressHandler,
            })
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

/**
 * Execute a method on a DAO's app.
 *
 * @param {Object} args Parameters
 * @param {string} args.dao DAO name or address
 * @param {string} args.app App address
 * @param {string} args.method Method name
 * @param {Array<*>} args.params Method parameters
 * @param {boolean} args.ipfsCheck Check if IPFS is running
 * @param {Object} args.reporter Reporter
 * @param {Object} args.apm APM config
 * @param {Object} args.web3 Web3 instance
 * @param {Object} args.wsProvider Ethereum provider
 * @param {string} args.gasPrice Gas price
 * @param {boolean} args.silent Silent task
 * @param {boolean} args.debug Debug mode
 * @returns {Promise} Execution promise
 */
export async function handler(args) {
  const tasks = await task(args)

  return tasks.run().then(ctx => {
    args.reporter.newLine()
    args.reporter.success(
      `Successfully executed: "${blue(ctx.transactionPath.description)}"`
    )
  })
}
