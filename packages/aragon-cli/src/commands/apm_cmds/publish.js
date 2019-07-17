const { ensureWeb3 } = require('../../helpers/web3-fallback')
const tmp = require('tmp-promise')
const path = require('path')
const { readJson, writeJson, pathExistsSync } = require('fs-extra')
const APM = require('@aragon/apm')
const semver = require('semver')
const TaskList = require('listr')
const taskInput = require('listr-input')
const inquirer = require('inquirer')
const chalk = require('chalk')
const { findProjectRoot, runScriptTask, ZERO_ADDRESS } = require('../../util')
const { compileContracts } = require('../../helpers/truffle-runner')
const web3Utils = require('web3-utils')
const deploy = require('../deploy')
const getRepoTask = require('../dao_cmds/utils/getRepoTask')
const startIPFS = require('../ipfs_cmds/start')
const propagateIPFS = require('../ipfs_cmds/propagate')
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
  generateFlattenedCode,
  copyCurrentApplicationArtifacts,
  SOLIDITY_FILE,
  POSITIVE_ANSWERS,
  ANSWERS,
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
    .option('init', {
      description: 'Arguments to be passed to contract constructor',
      array: true,
      default: [],
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
    .option('prepublish', {
      description:
        'Whether publish should run prepublish script specified in --prepublish-script before publishing',
      default: true,
      boolean: true,
    })
    .option('prepublish-script', {
      description: 'The npm script that will be run before publishing the app',
      default: 'prepublishOnly',
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
    .option('propagate-content', {
      description: 'Whether to propagate the content once published',
      boolean: true,
      default: true,
    })
    .option('skip-confirmation', {
      description: 'Whether to skip the confirmation step',
      boolean: true,
      default: false,
    })
}

const runSetupTask = ({
  reporter,

  // Globals
  gasPrice,
  cwd,
  web3,
  network,
  module,
  apm: apmOptions,
  silent,
  debug,

  // Arguments

  /// Scritps
  prepublish,
  prepublishScript,
  build,
  buildScript,

  /// Version
  bump,

  /// Contract
  contract,
  init,
  reuse,

  /// Conditionals
  onlyContent,
  onlyArtifacts,
  ipfsCheck,
  http,
}) => {
  if (onlyContent) {
    contract = ZERO_ADDRESS
  }
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)

  return new TaskList(
    [
      {
        title: 'Running prepublish script',
        enabled: () => prepublish,
        task: async (ctx, task) => runScriptTask(task, prepublishScript),
      },
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
        title: 'Building frontend',
        enabled: () => build && !http,
        task: async (ctx, task) => runScriptTask(task, buildScript),
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
            gasPrice,
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
    ],
    listrOpts(silent, debug)
  ).run()
}

const runPrepareForPublishTask = ({
  reporter,

  // Globals
  cwd,
  web3,
  network,
  module,
  apm: apmOptions,
  silent,
  debug,

  // Arguments

  /// Files
  publishDir,
  files,
  ignore,

  /// Http
  httpServedFrom,

  /// Storage
  provider,

  /// Conditionals
  onlyArtifacts,
  onlyContent,
  http,

  // Context
  initialRepo,
  initialVersion,
  version,
  contractAddress,
  deployArtifacts,
}) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)

  return new TaskList(
    [
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
          // TODO: (Gabi) Use inquier to handle confirmation
          async function invokeArtifactGeneration(answer) {
            if (POSITIVE_ANSWERS.indexOf(answer) > -1) {
              await generateApplicationArtifact(
                cwd,
                apm,
                dir,
                module,
                deployArtifacts,
                web3,
                reporter
              )
              await generateFlattenedCode(dir, module.path)
              return `Saved artifact in ${dir}/${ARTIFACT_FILE}`
            }
            throw new Error('Aborting publication...')
          }

          const dir = onlyArtifacts ? cwd : ctx.pathToPublish

          // If an artifact file exist we check it to reuse
          if (pathExistsSync(`${dir}/${ARTIFACT_FILE}`)) {
            const existingArtifactPath = path.resolve(dir, ARTIFACT_FILE)
            const existingArtifact = await readJson(existingArtifactPath)
            const rebuild = await sanityCheck(
              cwd,
              network.name,
              module,
              existingArtifact
            )
            if (rebuild) {
              return taskInput(
                `Couldn't reuse artifact due to mismatches, regenerate now? [y]es/[a]bort`,
                {
                  validate: value => {
                    return ANSWERS.indexOf(value) > -1
                  },
                  done: async answer => invokeArtifactGeneration(answer),
                }
              )
            } else {
              return task.skip('Using existing artifact')
            }
          }

          // If only content we fetch artifacts from previous version
          if (
            onlyContent &
            (apm.validInitialVersions.indexOf(version) === -1)
          ) {
            try {
              task.output = 'Fetching artifacts from previous version'
              await copyCurrentApplicationArtifacts(
                cwd,
                dir,
                apm,
                initialRepo,
                version,
                network.name,
                module
              )
              if (!pathExistsSync(`${dir}/${SOLIDITY_FILE}`)) {
                await generateFlattenedCode(dir, module.path)
              }
              return task.skip(`Using artifacts from v${initialVersion}`)
            } catch (e) {
              if (e.message === 'Artifact mismatch') {
                return taskInput(
                  "Couldn't reuse existing artifact due to mismatches, regenerate now? [y]es/[a]bort",
                  {
                    validate: value => {
                      return ANSWERS.indexOf(value) > -1
                    },
                    done: async answer => invokeArtifactGeneration(answer),
                  }
                )
              } else {
                return taskInput(
                  "Couldn't fetch current artifact version to copy it. Please make sure your IPFS or HTTP server are running. Otherwise, generate now? [y]es/[a]bort",
                  {
                    validate: value => {
                      return ANSWERS.indexOf(value) > -1
                    },
                    done: async answer => invokeArtifactGeneration(answer),
                  }
                )
              }
            }
          }

          await invokeArtifactGeneration('yes')

          return `Saved artifact in ${dir}/artifact.json`
        },
      },
      {
        title: `Publish intent`,
        task: async (ctx, task) => {
          const accounts = await web3.eth.getAccounts()
          const from = accounts[0]
          ctx.intent = await apm.publishVersionIntent(
            from,
            module.appName,
            version,
            provider,
            publishDir,
            contractAddress
          )
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

const runPublishTask = ({
  reporter,

  // Globals
  gasPrice,
  web3,
  wsProvider,
  module,
  apm: apmOptions,
  silent,
  debug,

  // Arguments
  /// Conditionals
  onlyArtifacts,
  onlyContent,

  /// Context
  dao,
  proxyAddress,
  methodName,
  params,
}) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)
  return new TaskList(
    [
      {
        title: `Publish ${module.appName}`,
        task: async (ctx, task) => {
          try {
            const getTransactionPath = wrapper => {
              return wrapper.getTransactionPath(
                proxyAddress,
                methodName,
                params
              )
            }

            return execTask(dao, getTransactionPath, {
              reporter,
              gasPrice,
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
  ).run()
}

exports.handler = async function({
  reporter,

  // Globals
  gasPrice,
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
  prepublish,
  prepublishScript,
  http,
  httpServedFrom,
  propagateContent,
  skipConfirmation,
}) {
  web3 = web3 || (await ensureWeb3(network))

  const {
    initialRepo,
    initialVersion,
    version,
    contract: contractAddress,
    deployArtifacts,
  } = await runSetupTask({
    reporter,
    gasPrice,
    cwd,
    web3,
    network,
    module,
    apm: apmOptions,
    silent,
    debug,
    prepublish,
    prepublishScript,
    build,
    buildScript,
    bump,
    contract,
    init,
    reuse,
    onlyContent,
    onlyArtifacts,
    ipfsCheck,
    http,
  })

  const { pathToPublish, intent } = await runPrepareForPublishTask({
    reporter,
    cwd,
    web3,
    network,
    module,
    apm: apmOptions,
    silent,
    debug,
    publishDir,
    files,
    ignore,
    httpServedFrom,
    provider,
    onlyArtifacts,
    onlyContent,
    http,
    // context
    initialRepo,
    initialVersion,
    version,
    contractAddress,
    deployArtifacts,
  })

  // Output publish info

  const { appName } = module
  const { dao, proxyAddress, methodName, params } = intent

  const contentURI = web3.utils.hexToAscii(params[params.length - 1])
  const [contentProvier, contentLocation] = contentURI.split(/:(.+)/)

  console.log(
    '\n',
    `The following information will be published:`,
    '\n',
    `Contract address: ${chalk.blue(contractAddress || ZERO_ADDRESS)}`,
    '\n',
    `Content (${contentProvier}): ${chalk.blue(contentLocation)}`,
    '\n'
    // TODO: (Gabi) Add extra relevant info (e.g. size)
    // `Size: ${chalk.blue()}`,
    // '\n',
    // `Number of files: ${chalk.blue()}`,
    // '\n'
  )

  if (!skipConfirmation) {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        message: chalk.green(`Publish to ${appName} repo`),
      },
    ])
    // new line after confirm
    console.log()
    if (!confirmation) return
  }

  const { receipt, transactionPath, repo } = await runPublishTask({
    reporter,
    gasPrice,
    web3,
    wsProvider,
    module,
    apm: apmOptions,
    silent,
    debug,
    onlyArtifacts,
    onlyContent,
    // context
    dao,
    proxyAddress,
    methodName,
    params,
  })

  const { transactionHash, status } = receipt

  if (!status) {
    reporter.error(`\nPublish transaction reverted:\n`)
  } else {
    // If the version is still the same, the publish intent was forwarded but not immediately executed (p.e. Voting)
    if (initialVersion === version) {
      console.log(
        '\n',
        `Successfully executed: "${chalk.green(
          transactionPath[0].description
        )}"`,
        '\n'
      )
    } else {
      const logVersion = 'v' + version

      console.log(
        '\n',
        `Successfully published ${appName} ${chalk.green(logVersion)} :`,
        '\n'
      )
    }
  }

  console.log(`Transaction hash: ${chalk.blue(transactionHash)}`, '\n')

  reporter.debug(`Published directory: ${chalk.blue(pathToPublish)}\n`)

  // Propagate content

  if (!skipConfirmation && propagateContent) {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        message: chalk.green(`Propagate content`),
      },
    ])
    // new line after confirm
    console.log()
    if (!confirmation) return repo

    await propagateIPFS.handler({
      reporter,
      apm: apmOptions,
      cid: contentLocation,
    })
  }
  return repo
}
