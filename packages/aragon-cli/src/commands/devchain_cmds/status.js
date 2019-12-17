import TaskList from 'listr'
import { blue } from 'chalk'
import execa from 'execa'
import find from 'find-process'
import { isPortTaken } from '@aragon/toolkit/dist/node'
//
import listrOpts from '../../helpers/listr-options'

export const command = 'status'
export const describe = 'Status of the local devchain.'

export const builder = yargs => {
  return yargs.option('port', {
    description: 'The port to check',
    default: 8545,
  })
}

export const task = async ({ port, reset, silent, debug }) => {
  return new TaskList(
    [
      {
        title: 'Check port',
        task: async ctx => {
          ctx.portTaken = await isPortTaken(port)
          if (ctx.portTaken) {
            const processData = await find('port', port)
            ctx.processID = processData[0].pid
          }
        },
      },
      {
        title: 'Kill running process',
        enabled: ctx => ctx.portTaken && reset,
        task: async ctx => {
          await execa('kill', [ctx.processID])
          return `Process running at port ${blue(port)} was killed.`
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

export const handler = async function({
  port,
  reset = false,
  reporter,
  debug,
  silent,
}) {
  const tasks = await task({
    port,
    reset,
    reporter,
    debug,
    silent,
  })

  const { portTaken, processID } = await tasks.run()

  reporter.newLine()

  if (portTaken && !reset) {
    reporter.info(`Devchain running at port: ${blue(port)}`)
    reporter.info(`Process ID: ${blue(processID)}`)
  } else if (!reset) {
    reporter.info(`Devchain is not running at port: ${blue(port)}`)
  }

  reporter.newLine()
}
