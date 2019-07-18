import TaskList from 'listr'
import execa from 'execa'
import goplatform from 'go-platform'
import inquirer from 'inquirer'
import { existsSync } from 'fs'
import chalk from 'chalk'
//
import listrOpts from '../../helpers/listr-options'
import {
  getNodePackageManager,
  getGlobalBinary,
  getLocalBinary,
} from '../../util'

exports.command = 'install'
exports.describe = 'Download and install the go-ipfs binaries.'

exports.builder = yargs => {
  return yargs
    .option('dist-version', {
      description: 'The version of IPFS that will be installed',
      default: '0.4.18-hacky2',
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
}

const runPrepareTask = ({ silent, debug, local }) => {
  return new TaskList(
    [
      {
        title: 'Determine platform and architecture',
        task: ctx => {
          ctx.NODE_OS = process.platform
          ctx.NODE_ARCH = process.arch
        },
      },
      {
        title: 'Determine golang distribution',
        task: ctx => {
          ctx.GO_OS = goplatform.GOOS
          ctx.GO_ARCH = goplatform.GOARCH
        },
      },
      {
        title: 'Determine location',
        task: async ctx => {
          if (local) {
            ctx.location = process.cwd()
            if (!existsSync('./package.json')) {
              const packageFile = chalk.red('package.json')
              const currentLocation = chalk.red(ctx.location)
              throw new Error(
                `${currentLocation} does not have a ${packageFile}. Did you wish to install IPFS globally?`
              )
            }
          } else {
            ctx.location = (await execa('npm', ['prefix', '--global'])).stdout
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

exports.handler = async function({
  debug,
  silent,
  distVersion,
  distUrl,
  local,
  reporter,
  skipConfirmation,
}) {
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

  // https://github.com/ipfs/npm-go-ipfs/blob/master/link-ipfs.js#L8
  // https://github.com/ipfs/npm-go-ipfs#publish-a-new-version-of-this-module-with-exact-same-go-ipfs-version
  const actualVersion = distVersion.replace(/-hacky[0-9]+/, '')
  const distName = `go-ipfs_v${actualVersion}_${GO_OS}-${GO_ARCH}.tar.gz`

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
