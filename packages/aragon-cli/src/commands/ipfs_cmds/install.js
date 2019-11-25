import TaskList from 'listr'
import execa from 'execa'
import inquirer from 'inquirer'
import chalk from 'chalk'
import listrOpts from '@aragon/cli-utils/src/helpers/listr-options'
//
import {
  getNodePackageManager,
  getGlobalBinary,
  getLocalBinary,
} from '../../util'
import {
  getPlatform,
  getArch,
  getArchForGO,
  isProject,
  cleanVersion,
  getGlobalNpmPrefix,
  getPlatformForGO,
  getDistName,
} from '../../lib/ipfs'

export const command = 'install'
export const describe = 'Download and install the go-ipfs binaries.'

export const builder = yargs =>
  yargs
    .option('dist-version', {
      description: 'The version of IPFS that will be installed',
      default: '0.4.22',
    })
    .option('dist-url', {
      description: 'The url from which to download IPFS',
      default: 'https://dist.ipfs.io',
    })
    .option('local', {
      description: 'Whether to install IPFS as a project dependency',
      boolean: true,
      default: false,
    })
    .option('skip-confirmation', {
      description: 'Whether to skip the confirmation step',
      boolean: true,
      default: false,
    })

const runPrepareTask = ({ silent, debug, local }) => {
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
            ctx.location = process.cwd()
            if (!isProject(ctx.location)) {
              throw new Error(
                `${chalk.red(ctx.location)} does not have a ${chalk.red(
                  'package.json'
                )}. Did you wish to install IPFS globally?`
              )
            }
          } else {
            ctx.location = await getGlobalNpmPrefix()
          }
        },
      },
    ],
    Object.assign({ concurrent: true }, listrOpts(silent, debug))
  ).run()
}

const runInstallTask = ({ silent, debug, local, distUrl, distVersion }) => {
  return new TaskList(
    [
      {
        title: 'Install IPFS',
        task: async task => {
          const npmBinary = getNodePackageManager()
          const exacaOptions = {
            env: {
              /*
               *  https://github.com/ipfs/npm-go-ipfs-dep/blob/v0.4.21/src/index.js#L71
               */
              GO_IPFS_DIST_URL: distUrl,
              /*
               *  specifying `TARGET_VERSION` here, will throw an error, because:
               *  https://github.com/ipfs/npm-go-ipfs/blob/master/link-ipfs.js#L49
               */
              // TARGET_VERSION: distVersion
            },
          }
          const npmArgs = ['install', `go-ipfs@${distVersion}`]

          if (local) {
            npmArgs.push('--save')
          } else {
            npmArgs.push('--global')
          }

          const logPrefix = `npm ${npmArgs.join(' ')}:`
          const installProcess = execa(npmBinary, npmArgs, exacaOptions)

          installProcess.stdout.on('data', data => {
            if (data) task.output = `${logPrefix} ${data}`
          })

          try {
            await installProcess
          } catch (execaResult) {
            if (execaResult.stderr.includes('No matching version found')) {
              throw new Error(
                `NPM cannot find version ${distVersion}. For more versions see: http://npmjs.com/package/go-ipfs?activeTab=versions`
              )
            } else {
              throw new Error(execaResult.stderr)
            }
          }
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
    reporter,
    skipConfirmation,
  } = argv
  /**
   * Check if it's already installed
   */
  const existingBinaryLocation = local
    ? getLocalBinary('ipfs', process.cwd())
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
    }
  )

  const actualVersion = cleanVersion(distVersion)
  const distName = getDistName(actualVersion, GO_OS, GO_ARCH)

  reporter.newLine()
  reporter.info(
    `Platform & architecture: ${chalk.blue(NODE_OS)}, ${chalk.blue(NODE_ARCH)}`
  )
  reporter.info(`IPFS tarball: ${chalk.blue(distName)}`)
  reporter.info(`IPFS distributions url: ${chalk.blue(distUrl)}`)
  reporter.info(`NPM version: ${chalk.blue(distVersion)}`)
  reporter.info(`Location: ${chalk.blue(location)}`)

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
  })

  reporter.newLine()
  reporter.success('Success!')
  reporter.info(
    `Try it out with: ${chalk.blue(
      local ? 'npx ipfs version' : 'ipfs version'
    )}`
  )
}
