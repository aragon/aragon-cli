import TaskList from 'listr'
import inquirer from 'inquirer'
import chalk from 'chalk'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
//
import { getGlobalBinary, getLocalBinary } from '../../util'
import { cleanVersion, getDistName } from '../../lib/ipfs'
import { installGoIpfs } from '../../lib/ipfs/install'
import {
  GO_IMPL_DIST_VERSION,
  GO_IMPL_DIST_URL,
} from '../../lib/ipfs/constants'
import { isPackage, getGlobalPackagesLocation } from '../../lib/node/packages'
import {
  getPlatform,
  getArch,
  getPlatformForGO,
  getArchForGO,
} from '../../lib/node'

export const command = 'install'
export const describe = 'Download and install the go-ipfs binaries.'

export const builder = yargs =>
  yargs
    .option('dist-version', {
      description: 'The version of IPFS that will be installed',
      default: GO_IMPL_DIST_VERSION,
    })
    .option('dist-url', {
      description: 'The url from which to download IPFS',
      default: GO_IMPL_DIST_URL,
    })
    .option('local', {
      description: 'Whether to install IPFS as a project dependency',
      boolean: true,
      default: false,
    })
    .option('project-path', {
      description: 'The project path to be used when installing locally',
      default: process.cwd(),
    })
    .option('skip-confirmation', {
      description: 'Whether to skip the confirmation step',
      boolean: true,
      default: false,
    })

const runPrepareTask = ({ silent, debug, local, projectPath }) => {
  return new TaskList(
    [
      {
        title: 'Determine platform and architecture',
        task: ctx => {
          ctx.NODE_OS = getPlatform()
          ctx.NODE_ARCH = getArch()
        },
      },
      {
        title: 'Determine golang distribution',
        task: ctx => {
          ctx.GO_OS = getPlatformForGO()
          ctx.GO_ARCH = getArchForGO()
        },
      },
      {
        title: 'Determine location',
        task: async ctx => {
          if (local) {
            ctx.location = projectPath
            if (!isPackage(ctx.location)) {
              throw new Error(
                `${chalk.red(ctx.location)} does not have a ${chalk.red(
                  'package.json'
                )}. Did you wish to install IPFS globally?`
              )
            }
          } else {
            ctx.location = await getGlobalPackagesLocation()
          }
        },
      },
    ],
    Object.assign({ concurrent: true }, listrOpts(silent, debug))
  ).run()
}

const runInstallTask = ({
  silent,
  debug,
  local,
  location,
  distUrl,
  distVersion,
}) => {
  return new TaskList(
    [
      {
        title: 'Install IPFS',
        task: async task => {
          await installGoIpfs(local, location, distVersion, distUrl, {
            logger: text => (task.output = text),
          })
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

export const handler = async argv => {
  const {
    debug,
    silent,
    distVersion,
    distUrl,
    local,
    projectPath,
    reporter,
    skipConfirmation,
  } = argv
  /**
   * Check if it's already installed
   */
  const existingBinaryLocation = local
    ? getLocalBinary('ipfs', projectPath)
    : getGlobalBinary('ipfs')

  if (existingBinaryLocation) {
    reporter.error(
      'IPFS is already installed:',
      chalk.red(existingBinaryLocation)
    )
    reporter.newLine()

    const uninstallCommand = local
      ? 'aragon ipfs uninstall --local'
      : 'aragon ipfs uninstall'
    reporter.warning(
      'To install a different version, you must first run:',
      chalk.yellow(uninstallCommand)
    )

    if (!local) {
      reporter.warning(
        'To install IPFS in a project, use the --local flag:',
        chalk.yellow('aragon ipfs install --local')
      )
    }
    return process.exit(1)
  }

  /**
   * Prepare confirmation details
   */
  reporter.info('Preparing:')
  const { NODE_OS, NODE_ARCH, GO_OS, GO_ARCH, location } = await runPrepareTask(
    {
      debug,
      silent,
      local,
      projectPath,
    }
  )

  const actualVersion = cleanVersion(distVersion)
  const distName = getDistName(actualVersion, GO_OS, GO_ARCH)

  reporter.info(
    `
Platform & architecture: ${chalk.blue(NODE_OS)}, ${chalk.blue(NODE_ARCH)}
IPFS tarball: ${chalk.blue(distName)}
IPFS distributions url: ${chalk.blue(distUrl)}
NPM version: ${chalk.blue(distVersion)}
Location: ${chalk.blue(location)}`
  )

  /**
   * Confirm & install
   */
  reporter.newLine()
  if (!skipConfirmation) {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        message: `Are you sure you want to ${chalk.green('install IPFS')}?`,
      },
    ])
    if (!confirmation) return
  }

  await runInstallTask({
    debug,
    silent,
    distUrl,
    distVersion,
    local,
    location,
  })

  reporter.newLine()
  reporter.success('Success!')
  reporter.info(
    `Try it out with: ${chalk.blue(
      local ? 'npx ipfs version' : 'ipfs version'
    )}`
  )
}
