const TaskList = require('listr')
const { blue } = require('chalk')
const execa = require('execa')
const find = require('find-process')
const { isPortTaken } = require('@aragon/toolkit/dist/node')
//
const listrOpts = require('../../helpers/listr-options')

exports.command = 'status'
exports.describe = 'Status of the local devchain.'

exports.builder = yargs => {
  return yargs.option('port', {
    description: 'The port to check',
    default: 8545,
  })
}

exports.task = async ({ port, reset, silent, debug }) => {
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

exports.handler = async function({
  port,
  reset = false,
  reporter,
  debug,
  silent,
}) {
  const task = await exports.task({
    port,
    reset,
    reporter,
    debug,
    silent,
  })

  const { portTaken, processID } = await task.run()

  reporter.newLine()

  if (portTaken && !reset) {
    reporter.info(`Devchain running at port: ${blue(port)}`)
    reporter.info(`Process ID: ${blue(processID)}`)
  } else if (!reset) {
    reporter.info(`Devchain is not running at port: ${blue(port)}`)
  }

  reporter.newLine()
}
