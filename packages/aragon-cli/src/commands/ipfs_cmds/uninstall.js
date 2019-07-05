import TaskList from 'listr'
import execa from 'execa'
import chalk from 'chalk'
import inquirer from 'inquirer'
//
import listrOpts from '../../helpers/listr-options'
import {
  getGlobalBinary,
  getLocalBinary,
  getNodePackageManager,
} from '../../util'

exports.command = 'uninstall'
exports.describe = 'Uninstall IPFS'

exports.builder = yargs => {
  return yargs
    .option('local', {
      description: 'Whether to uninstall from the local project',
      boolean: true,
      default: false,
    })
    .option('skip-confirmation', {
      description: 'Whether to skip the confirmation step',
      boolean: true,
      default: false,
    })
}

const runCheckTask = ({ silent, debug, local }) => {
  return new TaskList(
    [
      {
        title: 'Check current installation',
        task: ctx => {
          ctx.ipfsBinPath = local
            ? getLocalBinary('ipfs', process.cwd())
            : getGlobalBinary('ipfs')

          if (ctx.ipfsBinPath === null) {
            throw new Error('IPFS is not installed')
          }
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

const runUninstallTask = ({ silent, debug, local }) => {
  return new TaskList(
    [
      {
        title: 'Uninstall IPFS',
        task: async task => {
          const npmBinary = getNodePackageManager()
          const npmArgs = ['uninstall', 'go-ipfs']
          if (!local) {
            npmArgs.push('--global')
          }

          const logPrefix = `npm ${npmArgs.join(' ')}:`
          const uninstallProcess = execa(npmBinary, npmArgs)

          uninstallProcess.stdout.on('data', log => {
            if (log) task.output = `${logPrefix} ${log}`
          })

          await uninstallProcess
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

exports.handler = async function({ debug, silent, skipConfirmation, local }) {
  const { ipfsBinPath } = await runCheckTask({ silent, debug, local })

  console.log('\n', `Location: ${chalk.blue(ipfsBinPath)}`, '\n')

  if (!skipConfirmation) {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        default: false,
        message: chalk.red('Uninstall IPFS'),
      },
    ])
    // new line after confirm
    console.log()
    if (!confirmation) return
  }

  await runUninstallTask({
    silent,
    debug,
    local,
  })

  console.log('\n', 'Success!')
}
