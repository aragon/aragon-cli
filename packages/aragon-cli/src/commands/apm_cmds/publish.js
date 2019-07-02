const { ensureWeb3 } = require('../../helpers/web3-fallback')
const fs = require('fs')
const tmp = require('tmp-promise')
const path = require('path')
const { readJson, writeJson, pathExistsSync } = require('fs-extra')
const APM = require('@aragon/apm')
const semver = require('semver')
const TaskList = require('listr')
const taskInput = require('listr-input')
const {
  findProjectRoot,
  getNodePackageManager,
  ZERO_ADDRESS,
} = require('../../util')
const execa = require('execa')
const { compileContracts } = require('../../helpers/truffle-runner')
const web3Utils = require('web3-utils')
const deploy = require('../deploy')
const startIPFS = require('../ipfs_cmds/start')
const viewIPFSContent = require('../ipfs_cmds/view')
const getRepoTask = require('../dao_cmds/utils/getRepoTask')
const execTask = require('../dao_cmds/utils/execHandler').task
const listrOpts = require('../../helpers/listr-options')

const {
  prepareFilesForPublishing,
  MANIFEST_FILE,
  ARTIFACT_FILE,
} = require('./util/preprare-files')

const {
  getMajor,
  sanityCheck,
  generateApplicationArtifact,
  copyCurrentApplicationArtifacts,
} = require('./util/generate-artifact')

exports.command = 'publish <bump> [contract]'

exports.describe = 'Publish a new version of the application'

exports.builder = function(yargs) {
  return deploy
    .builder(yargs) // inherit deploy options
    .positional('bump', {
      description: 'Type of bump (major, minor or patch) or version number',
      type: 'string',
    })
    .positional('contract', {
      description:
        "The address or name of the contract to publish in this version. If it isn't provided, it will default to the current version's contract.",
      type: 'string',
    })
    .option('only-artifacts', {
      description: 'Whether just generate artifacts file without publishing',
      default: false,
      boolean: true,
    })
    .option('provider', {
      description: 'The aragonPM storage provider to publish files to',
      default: 'ipfs',
      choices: ['ipfs'],
    })
    .option('reuse', {
      description:
        'Whether to reuse the previous version contract and skip deployment on non-major versions',
      default: false,
      boolean: true,
    })
    .option('files', {
      description:
        'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
      default: ['.'],
      array: true,
    })
    .option('ignore', {
      description:
        'A gitignore pattern of files to ignore. Specify multiple times to add multiple patterns.',
      array: true,
      default: ['node_modules'],
    })
    .option('ipfs-check', {
      description: 'Whether to have publish start IPFS if not started',
      boolean: true,
      default: true,
    })
    .option('publish-dir', {
      description:
        'Temporary directory where files will be copied before publishing. Defaults to temp dir.',
      default: null,
    })
    .option('only-content', {
      description:
        'Whether to skip contract compilation, deployment and contract artifact generation',
      default: false,
      boolean: true,
    })
    .option('build', {
      description:
        'Whether publish should try to build the app before publishing, running the script specified in --build-script',
      default: true,
      boolean: true,
    })
    .option('build-script', {
      description: 'The npm script that will be run when building the app',
      default: 'build',
    })
    .option('http', {
      description: 'URL for where your app is served e.g. localhost:1234',
      default: null,
    })
    .option('http-served-from', {
      description:
        'Directory where your files is being served from e.g. ./dist',
      default: null,
    })
}

const POSITIVE_ANSWERS = ['yes', 'y']
const NEGATIVE_ANSWERS = ['no', 'n', 'abort', 'a']
const ANSWERS = POSITIVE_ANSWERS.concat(NEGATIVE_ANSWERS)

exports.task = function({
  reporter,

  // Globals
  cwd,
  web3,
  network,
  wsProvider,
  module,
  apm: apmOptions,
  silent,
  debug,

  // Arguments

  bump,
  contract,
  onlyArtifacts,
  reuse,
  provider,
  files,
  ignore,
  ipfsCheck,
  publishDir,
  init,
  onlyContent,
  build,
  buildScript,
  http,
  httpServedFrom,
}) {
  if (onlyContent) {
    contract = ZERO_ADDRESS
  }

  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)

  return new TaskList(
    [
      {
        title: 'Check IPFS',
        task: () => startIPFS.task({ apmOptions }),
        enabled: () => !http && ipfsCheck,
      },
      {
        title: `Applying version bump (${bump})`,
        task: async ctx => {
          let isValid = true
          try {
            const ipfsTimeout = 1000 * 60 * 5 // 5min
            reporter.info('Fetching latest version from aragonPM...')
            ctx.initialRepo = await apm.getLatestVersion(
              module.appName,
              ipfsTimeout
            )

            ctx.initialVersion = ctx.initialRepo.version

            ctx.version = semver.valid(bump)
              ? semver.valid(bump)
              : semver.inc(ctx.initialVersion, bump)

            isValid = await apm.isValidBump(
              module.appName,
              ctx.initialVersion,
              ctx.version
            )
            if (!isValid) {
              throw new Error(
                "Version bump is not valid, you have to respect APM's versioning policy. Check the version upgrade rules in the documentation: https://hack.aragon.org/docs/apm-ref.html#version-upgrade-rules"
              )
            }

            ctx.shouldDeployContract =
              getMajor(ctx.initialVersion) !== getMajor(ctx.version)
          } catch (e) {
            if (e.message.indexOf('Invalid content URI') === 0) {
              return
            }
            // Repo doesn't exist yet, deploy the first version
            ctx.version = semver.valid(bump)
              ? semver.valid(bump)
              : semver.inc('0.0.0', bump) // All valid initial versions are a version bump from 0.0.0
            if (apm.validInitialVersions.indexOf(ctx.version) === -1) {
              throw new Error(
                `Invalid initial version  (${ctx.version}). It can only be 0.0.1, 0.1.0 or 1.0.0.`
              )
            }
            ctx.shouldDeployContract = true // assume first version should deploy a contract
          }
        },
      },
      {
        title: 'Compile contracts',
        task: async () => compileContracts(),
        enabled: () => !onlyContent && web3Utils.isAddress(contract),
      },
      {
        title: 'Deploy contract',
        task: async ctx => {
          const deployTaskParams = {
            contract,
            init,
            reporter,
            network,
            cwd,
            web3,
            apmOptions,
          }

          return deploy.task(deployTaskParams)
        },
        enabled: ctx =>
          !onlyContent &&
          ((contract && !web3Utils.isAddress(contract)) ||
            (!contract && ctx.shouldDeployContract && !reuse)),
      },
      {
        title: 'Determine contract address for version',
        task: async (ctx, task) => {
          if (web3Utils.isAddress(contract)) {
            ctx.contract = contract
          }

          // Check if we can fall back to a previous contract address
          if (
            !ctx.contract &&
            apm.validInitialVersions.indexOf(ctx.version) === -1
          ) {
            task.output = 'No contract address provided, using previous one'

            try {
              const { contractAddress } = await apm.getLatestVersion(
                module.appName
              )
              ctx.contract = contractAddress
              return `Using ${ctx.contract}`
            } catch (err) {
              throw new Error('Could not determine previous contract')
            }
          }

          // Contract address required for initial version
          if (!ctx.contract) {
            throw new Error('No contract address supplied for initial version')
          }

          return `Using ${contract}`
        },
        enabled: () => !onlyArtifacts,
      },
      {
        title: 'Building frontend',
        enabled: () => build && !http,
        task: async (ctx, task) => {
          if (!fs.existsSync('package.json')) {
            task.skip('No package.json found')
            return
          }

          const packageJson = await readJson('package.json')
          const scripts = packageJson.scripts || {}
          if (!scripts[buildScript]) {
            task.skip('Build script not defined in package.json')
            return
          }

          const bin = getNodePackageManager()
          const buildTask = execa(bin, ['run', buildScript])

          buildTask.stdout.on('data', log => {
            if (!log) return
            task.output = `npm run ${buildScript}: ${log}`
          })

          return buildTask.catch(err => {
            throw new Error(
              `${err.message}\n${err.stderr}\n\nFailed to build. See above output.`
            )
          })
        },
      },
      {
        title: 'Prepare files for publishing',
        task: async (ctx, task) => {
          // Create temporary directory
          if (!publishDir) {
            const { path: tmpDir } = await tmp.dir()
            publishDir = tmpDir
          }

          await prepareFilesForPublishing(publishDir, files, ignore)
          ctx.pathToPublish = publishDir

          return `Files copied to temporary directory: ${ctx.pathToPublish}`
        },
        enabled: () => !http,
      },
      {
        title:
          'Check for --http-served-from argument and copy manifest.json to destination',
        task: async (ctx, task) => {
          if (!httpServedFrom) {
            throw new Error('You need to provide --http-served-from argument')
          }

          const projectRoot = findProjectRoot()
          const manifestOrigin = path.resolve(projectRoot, MANIFEST_FILE)
          const manifestDst = path.resolve(httpServedFrom, MANIFEST_FILE)

          if (!pathExistsSync(manifestDst) && pathExistsSync(manifestOrigin)) {
            let manifest = await readJson(manifestOrigin)
            manifest.start_url = path.basename(manifest.start_url)
            manifest.script = path.basename(manifest.script)
            await writeJson(manifestDst, manifest)
          }

          ctx.pathToPublish = httpServedFrom
        },
        enabled: () => http,
      },
      {
        title: 'Generate application artifact',
        skip: () => onlyContent && !module.path,
        task: async (ctx, task) => {
          async function invokeAction(answer) {
            if (POSITIVE_ANSWERS.indexOf(answer) > -1) {
              await generateApplicationArtifact(
                cwd,
                dir,
                module,
                ctx.deployArtifacts
              )
              return `Saved artifact in ${dir}/${ARTIFACT_FILE}`
            }
            throw new Error('Aborting publication...')
          }

          const dir = onlyArtifacts ? cwd : ctx.pathToPublish

          if (pathExistsSync(`${dir}/${ARTIFACT_FILE}`)) {
            const artifactPath = path.resolve(dir, ARTIFACT_FILE)
            const artifact = await readJson(artifactPath)
            const rebuild = await sanityCheck(
              network.name,
              module.appName,
              module.registry,
              module.path,
              artifact
            )
            if (!rebuild) {
              return task.skip('Using existent artifact')
            } else {
              return taskInput(
                "Couldn't reuse artifact due to mismatches, regenerate now? [y]es/[a]bort",
                {
                  validate: value => {
                    return ANSWERS.indexOf(value) > -1
                  },
                  done: async answer => invokeAction(answer),
                }
              )
            }
          }

          if (onlyContent) {
            try {
              task.output = 'Fetching artifacts from previous version'
              await copyCurrentApplicationArtifacts(
                dir,
                apm,
                network.name,
                module.appName,
                module.registry,
                module.path,
                ctx.initialRepo,
                ctx.version
              )
              return task.skip(`Using artifacts from v${ctx.initialVersion}`)
            } catch (e) {
              if (e.message === 'Artifact mismatch') {
                return taskInput(
                  "Couldn't reuse existing artifact due to mismatches, regenerate now? [y]es/[a]bort",
                  {
                    validate: value => {
                      return ANSWERS.indexOf(value) > -1
                    },
                    done: async answer => invokeAction(answer),
                  }
                )
              } else {
                return taskInput(
                  "Couldn't fetch existing artifact, generate now? [y]es/[a]bort",
                  {
                    validate: value => {
                      return ANSWERS.indexOf(value) > -1
                    },
                    done: async answer => invokeAction(answer),
                  }
                )
              }
            }
          }
          await generateApplicationArtifact(
            cwd,
            apm,
            dir,
            module,
            ctx.deployArtifacts,
            web3,
            reporter
          )
          return `Saved artifact in ${dir}/artifact.json`
        },
      },
      {
        title: `Output publish information`,
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) => {
          const contentProvider = http ? 'http' : provider
          reporter.info('The following information will be published:')

          reporter.info(
            `Contract address: ${ctx.contract ? ctx.contract : ZERO_ADDRESS}`
          )

          const contentURI = await apm.uploadFilesToStorageProvider(
            contentProvider,
            ctx.pathToPublish
          )

          const contentLocation = contentURI.split(/:(.+)/)[1]

          reporter.info(`Content (${contentProvider}): ${contentLocation}`)

          if (!http) {
            reporter.info(`IPFS content tree:`)
            await viewIPFSContent.task(
              reporter,
              apmOptions,
              contentLocation,
              debug,
              silent
            )
          }

          return taskInput(
            `Confirm publish to ${module.appName} repo? [y]es/[a]bort`,
            {
              validate: value => {
                return ANSWERS.indexOf(value) > -1
              },
              done: async answer => {
                if (POSITIVE_ANSWERS.indexOf(answer) > -1) {
                  return
                }
                throw new Error('Aborting publication...')
              },
            }
          )
        },
      },
      {
        title: `Publish ${module.appName}`,
        task: async (ctx, task) => {
          ctx.contractInstance = null // clean up deploy sub-command artifacts

          const accounts = await web3.eth.getAccounts()
          const from = accounts[0]

          try {
            const intent = await apm.publishVersionIntent(
              from,
              module.appName,
              ctx.version,
              http ? 'http' : provider,
              http || ctx.pathToPublish,
              ctx.contract
            )

            const { dao, proxyAddress, methodName, params } = intent

            const getTransactionPath = wrapper => {
              return wrapper.getTransactionPath(
                proxyAddress,
                methodName,
                params
              )
            }

            return execTask(dao, getTransactionPath, {
              reporter,
              apm: apmOptions,
              web3,
              wsProvider,
            })
          } catch (e) {
            throw e
          }
        },
        enabled: () => !onlyArtifacts,
      },
      {
        title: 'Fetch published repo',
        task: getRepoTask.task({
          artifactRequired: onlyContent,
          apmRepo: module.appName,
          apm,
        }),
      },
    ],
    listrOpts(silent, debug)
  )
}

exports.handler = async args => {
  const { reporter, network, module, onlyContent } = args

  const web3 = await ensureWeb3(network)

  return exports
    .task({ ...args, web3 })
    .run({ web3 })
    .then(ctx => {
      const { appName } = module
      const { transactionHash, status } = ctx.receipt
      const { version, content, contractAddress } = ctx.repo

      if (!status) {
        reporter.error(`Publish transaction reverted:`)
      } else {
        // If the version is still the same, the publish intent was forwarded but not immediately executed (p.e. Voting)
        if (ctx.initialVersion === version) {
          reporter.success(
            `Successfully executed: "${ctx.transactionPath[0].description}"`
          )
        } else {
          reporter.success(`Successfully published ${appName} v${version} : `)
          if (!onlyContent) {
            reporter.info(`Contract address: ${contractAddress}`)
          }
          reporter.info(`Content (${content.provider}): ${content.location}`)
        }
      }

      reporter.info(`Transaction hash: ${transactionHash}`)
      reporter.debug(`Published directory: ${ctx.pathToPublish}`)
      process.exit(status ? 0 : 1)
    })
    .catch(() => {
      process.exit(1)
    })
}
