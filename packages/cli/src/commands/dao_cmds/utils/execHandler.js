import TaskList from 'listr'
import { blue } from 'chalk'
import { exec } from '@aragon/toolkit'
//
import listrOpts from '../../../helpers/listr-options'

/**
 * Return a task list for executing a method on a
 * DAO's app.
 *
 * @param {Object} params Parameters
 * @param {Object} params.environment Environment config
 * @param {string} params.dao DAO name or address
 * @param {string} params.app App address
 * @param {string} params.method Method name
 * @param {Array<*>} params.params Method parameters
 * @param {boolean} params.silent Silent task
 * @param {boolean} params.debug Debug mode
 * @returns {Promise<TaskList>} Execution task list
 */
export async function task({
  environment,
  dao,
  app,
  method,
  params,
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
            await exec(dao, app, method, params, progressHandler, environment)
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
 * @param {Object} args.reporter Reporter
 * @param {Object} params.environment Environment config
 * @param {string} args.dao DAO name or address
 * @param {string} args.app App address
 * @param {string} args.method Method name
 * @param {Array<*>} args.params Method parameters
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
