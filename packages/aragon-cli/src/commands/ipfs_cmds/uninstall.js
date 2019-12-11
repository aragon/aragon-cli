import TaskList from 'listr'
import execa from 'execa'
import inquirer from 'inquirer'
import { blue, red } from 'chalk'
import {
  getGlobalBinary,
  getLocalBinary,
  getNodePackageManager,
} from '@aragon/toolkit/dist/ipfs'
//
import listrOpts from '../../helpers/listr-options'

export const command = 'uninstall'
export const describe = 'Uninstall the go-ipfs binaries.'

export const builder = yargs =>
  yargs
    .option('local', {
      description: 'Whether to uninstall IPFS from the project dependencies',
      boolean: true,
      default: false,
    })
    .option('skip-confirmation', {
      description: 'Whether to skip the confirmation step',
      boolean: true,
      default: false,
    })

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

export const handler = async argv => {
  const { debug, silent, skipConfirmation, local, reporter } = argv
  /**
   * Check if it's installed
   */
  const ipfsBinPath = local
    ? getLocalBinary('ipfs', process.cwd())
    : getGlobalBinary('ipfs')

  if (!ipfsBinPath) {
    reporter.error('IPFS is not installed')
    return process.exit(1)
  }
  /**
   * Print confirmation details
   */
  reporter.info(`Location: ${blue(ipfsBinPath)}`)

  /**
   * Confirm & uninstall
   */
  reporter.newLine()
  if (!skipConfirmation) {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        default: false,
        message: `Are you sure you want to ${red('uninstall IPFS')}?`,
      },
    ])
    if (!confirmation) return
  }

  await runUninstallTask({
    silent,
    debug,
    local,
  })

  reporter.newLine()
  reporter.success('Success!')
}
