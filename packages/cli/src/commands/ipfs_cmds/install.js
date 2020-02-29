import TaskList from 'listr'
import inquirer from 'inquirer'
import { blue, red, yellow, green } from 'chalk'
//
import {
  cleanVersion,
  getDistName,
  installGoIpfs,
  GO_IMPL_DIST_VERSION,
  GO_IMPL_DIST_URL,
  isPackage,
  getGlobalPackagesLocation,
  getPlatform,
  getArch,
  getPlatformForGO,
  getArchForGO,
} from '../../lib/ipfs'
import { getGlobalBinary, getLocalBinary } from '../../lib/node'
import listrOpts from '../../helpers/listr-options'

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
                `${red(ctx.location)} does not have a ${red(
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
    reporter.error('IPFS is already installed:', red(existingBinaryLocation))
    reporter.newLine()

    const uninstallCommand = local
      ? 'aragon ipfs uninstall --local'
      : 'aragon ipfs uninstall'
    reporter.warning(
      'To install a different version, you must first run:',
      yellow(uninstallCommand)
    )

    if (!local) {
      reporter.warning(
        'To install IPFS in a project, use the --local flag:',
        yellow('aragon ipfs install --local')
      )
    }
    throw Error()
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

  reporter.newLine()
  reporter.info(`Platform & architecture: ${blue(NODE_OS)}, ${blue(NODE_ARCH)}`)
  reporter.info(`IPFS tarball: ${blue(distName)}`)
  reporter.info(`IPFS distributions url: ${blue(distUrl)}`)
  reporter.info(`IPFS version: ${blue(distVersion)}`)
  reporter.info(`Location: ${blue(location)}`)

  /**
   * Confirm & install
   */
  reporter.newLine()
  if (!skipConfirmation) {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        message: `Are you sure you want to ${green('install IPFS')}?`,
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
    `Try it out with: ${blue(local ? 'npx ipfs version' : 'ipfs version')}`
  )
}
