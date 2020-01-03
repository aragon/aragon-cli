import tmp from 'tmp-promise'
import path from 'path'
import semver from 'semver'
import TaskList from 'listr'
import taskInput from 'listr-input'
import APM from '@aragon/apm'
import { isAddress } from 'web3-utils'
import { blue, red, green, bold } from 'chalk'
import { readJson, writeJson, pathExistsSync } from 'fs-extra'
import {
  ZERO_ADDRESS,
  isLocalDaemonRunning,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
  getHttpClient,
} from '@aragon/toolkit'

// helpers
import { ensureWeb3 } from '../../helpers/web3-fallback'
import { compileContracts } from '../../helpers/truffle-runner'
import listrOpts from '../../helpers/listr-options'

// cmds
import { task as deployTask, builder as deployBuilder } from '../deploy'

import { runPropagateTask } from '../ipfs_cmds/propagate'
import { findProjectRoot, runScriptTask, askForConfirmation } from '../../util'
import {
  prepareFilesForPublishing,
  MANIFEST_FILE,
  ARTIFACT_FILE,
} from './util/preprare-files'
import {
  getMajor,
  sanityCheck,
  generateApplicationArtifact,
  generateFlattenedCode,
  copyCurrentApplicationArtifacts,
  SOLIDITY_FILE,
  POSITIVE_ANSWERS,
  ANSWERS,
} from './util/generate-artifact'

export const command = 'publish <bump> [contract]'
export const describe = 'Publish a new version of the application'

export const builder = function(yargs) {
  return deployBuilder(yargs) // inherit deploy options
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
      default: false,
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

export const runSetupTask = ({
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
  http,
}) => {
  if (onlyContent) {
    contract = ZERO_ADDRESS
  }
  const apm = APM(web3, apmOptions)

  return new TaskList(
    [
      {
        title: 'Start IPFS',
        skip: async () => isLocalDaemonRunning(),
        task: async () => {
          await startLocalDaemon(getBinaryPath(), getDefaultRepoPath(), {
            detached: false,
          })
        },
      },
      {
        title: 'Running prepublish script',
        enabled: () => prepublish,
        task: async (ctx, task) => runScriptTask(task, prepublishScript),
      },
      {
        title: `Applying version bump (${bump})`,
        task: async (ctx, task) => {
          let isValid = true
          try {
            const ipfsTimeout = 1000 * 60 * 5 // 5min

            task.output = 'Fetching latest version from aragonPM...'

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
        enabled: () => !onlyContent && isAddress(contract),
        task: async () => compileContracts(),
      },
      {
        title: 'Deploy contract',
        enabled: ctx =>
          !onlyContent &&
          ((contract && !isAddress(contract)) ||
            (!contract && ctx.shouldDeployContract && !reuse)),
        task: async ctx => {
          const deployTaskParams = {
            module,
            contract,
            init,
            gasPrice,
            network,
            cwd,
            web3,
            apmOptions,
          }
          return deployTask(deployTaskParams)
        },
      },
      {
        title: 'Determine contract address for version',
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) => {
          // Get address of deployed contract
          ctx.contract = ctx.contractAddress
          if (isAddress(contract)) {
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

          return `Using ${ctx.contract}`
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

export const runPrepareForPublishTask = ({
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
  const apm = APM(web3, apmOptions)

  return new TaskList(
    [
      {
        title: 'Prepare files for publishing',
        enabled: () => !http,
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
      },
      {
        title:
          'Check for --http-served-from argument and copy manifest.json to destination',
        enabled: () => http,
        task: async (ctx, task) => {
          if (!httpServedFrom) {
            throw new Error('You need to provide --http-served-from argument')
          }

          const projectRoot = findProjectRoot()
          const manifestOrigin = path.resolve(projectRoot, MANIFEST_FILE)
          const manifestDst = path.resolve(httpServedFrom, MANIFEST_FILE)

          if (!pathExistsSync(manifestDst) && pathExistsSync(manifestOrigin)) {
            const manifest = await readJson(manifestOrigin)
            manifest.start_url = path.basename(manifest.start_url)
            manifest.script = path.basename(manifest.script)
            await writeJson(manifestDst, manifest)
          }

          ctx.pathToPublish = httpServedFrom
        },
      },
      {
        title: 'Generate application artifact',
        skip: () => onlyContent && !module.path,
        task: async (ctx, task) => {
          const dir = onlyArtifacts ? cwd : ctx.pathToPublish

          const contractPath = module.path
          const roles = module.roles

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
              await generateFlattenedCode(dir, contractPath)
              return `Saved artifact in ${dir}/${ARTIFACT_FILE}`
            }
            throw new Error('Aborting publication...')
          }

          // If an artifact file exist we check it to reuse
          if (pathExistsSync(`${dir}/${ARTIFACT_FILE}`)) {
            const existingArtifactPath = path.resolve(dir, ARTIFACT_FILE)
            const existingArtifact = await readJson(existingArtifactPath)
            const rebuild = await sanityCheck(
              cwd,
              roles,
              contractPath,
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
                roles,
                contractPath
              )
              if (!pathExistsSync(`${dir}/${SOLIDITY_FILE}`)) {
                await generateFlattenedCode(dir, contractPath)
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
          ctx.contractInstance = null // clean up deploy sub-command artifacts
          const accounts = await web3.eth.getAccounts()
          const from = accounts[0]

          ctx.intent = await apm.publishVersionIntent(
            from,
            module.appName,
            version,
            http ? 'http' : provider,
            http || ctx.pathToPublish,
            contractAddress
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

export const runPublishTask = ({
  reporter,

  // Globals
  gasPrice,
  web3,
  // wsProvider,
  module,
  http,
  provider,
  apm: apmOptions,
  silent,
  debug,

  // Arguments
  /// Conditionals
  onlyArtifacts,

  /// Context
  version,
  pathToPublish,
  contractAddress,
  // dao,
  // proxyAddress,
  // methodName,
  // params,
}) => {
  const apm = APM(web3, apmOptions)
  return new TaskList(
    [
      // { // TODO: Use this task once we fix publish with intent
      //   title: `Publish ${module.appName}`,
      //   enabled: () => !onlyArtifacts,
      //   task: async (ctx, task) =>
      //     execTask({
      //       dao,
      //       app: proxyAddress,
      //       method: methodName,
      //       params,
      //       reporter,
      //       gasPrice,
      //       apm: apmOptions,
      //       web3,
      //       wsProvider,
      //     }),
      // },
      {
        title: `Publish ${module.appName}`,
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) => {
          ctx.contractInstance = null // clean up deploy sub-command artifacts

          task.output = 'Generating transaction and waiting for confirmation'
          const accounts = await web3.eth.getAccounts()
          const from = accounts[0]

          const transaction = await apm.publishVersion(
            from,
            module.appName,
            version,
            http ? 'http' : provider,
            http || pathToPublish,
            contractAddress,
            from
          )

          transaction.from = from
          transaction.gasPrice = gasPrice
          // apm.js already calculates the recommended gas

          ctx.receipt = await web3.eth.sendTransaction(transaction)
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

export const handler = async function({
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
    http,
  }).run()

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
  }).run()

  // Output publish info

  const { appName } = module
  const { dao, proxyAddress, methodName, params } = intent

  const contentURI = web3.utils.hexToAscii(params[params.length - 1])
  const [contentProvier, contentLocation] = contentURI.split(/:(.+)/)

  if (files.length === 1 && path.normalize(files[0]) === '.') {
    reporter.newLine()
    reporter.warning(
      `Publishing files from the project's root folder is not recommended. Consider using the distribution folder of your project: "--files <folder>".`
    )
  }

  console.log(
    '\n',
    `The following information will be published:`,
    '\n',
    `Contract address: ${blue(contractAddress || ZERO_ADDRESS)}`,
    '\n',
    `Content (${contentProvier}): ${blue(contentLocation)}`,
    '\n'
    // TODO: (Gabi) Add extra relevant info (e.g. size)
    // `Size: ${blue()}`,
    // '\n',
    // `Number of files: ${blue()}`,
    // '\n'
  )

  if (contentProvier === 'ipfs') {
    reporter.debug(
      'Explore the ipfs content locally:',
      '\n',
      bold(
        `http://localhost:8080/ipfs/QmSDgpiHco5yXdyVTfhKxr3aiJ82ynz8V14QcGKicM3rVh/#/explore/${contentLocation}`
      ),
      '\n'
    )
  }

  if (!skipConfirmation) {
    const reply = await askForConfirmation(
      `${green(`Publish to ${appName} repo`)}`
    )
    console.log()
    // new line after confirm
    if (!reply) return console.log()
  }

  const { receipt /*, transactionPath */ } = await runPublishTask({
    reporter,
    gasPrice,
    web3,
    wsProvider,
    module,
    http,
    provider,
    apm: apmOptions,
    silent,
    debug,
    onlyArtifacts,
    onlyContent,
    // context
    version,
    pathToPublish,
    contractAddress,
    dao,
    proxyAddress,
    methodName,
    params,
  }).run()

  const { transactionHash, status } = receipt

  if (!status) {
    reporter.error(`\nPublish transaction reverted:\n`)
  } else {
    // If the version is still the same, the publish intent was forwarded but not immediately executed (p.e. Voting)
    // if (initialVersion === version) {
    //   console.log(
    //     '\n',
    //     `Successfully executed: "${green(transactionPath[0].description)}"`,
    //     '\n'
    //   )
    // } else {
    const logVersion = 'v' + version

    console.log(
      '\n',
      `Successfully published ${appName} ${green(logVersion)} :`,
      '\n'
    )
    // }
  }

  console.log(`Transaction hash: ${blue(transactionHash)}`, '\n')

  reporter.debug(`Published directory: ${blue(pathToPublish)}\n`)

  // Propagate content
  if (!http && propagateContent) {
    if (!skipConfirmation) {
      const reply = await askForConfirmation(green(`Propagate content`))
      // new line after confirm
      if (!reply) return console.log()
    }

    const ipfsReader = await getHttpClient(apmOptions.ipfs.gateway)

    const { CIDs, result } = await runPropagateTask({
      ipfsReader,
      cid: contentLocation,
      debug,
      silent,
    })

    console.log(
      '\n',
      `Queried ${blue(CIDs.length)} CIDs at ${blue(
        result.gateways.length
      )} gateways`,
      '\n',
      `Requests succeeded: ${green(result.succeeded)}`,
      '\n',
      `Requests failed: ${red(result.failed)}`,
      '\n'
    )

    reporter.debug(`Gateways: ${result.gateways.join(', ')}`)

    if (result.errors && result.errors.length) {
      reporter.debug(
        `Errors: \n${result.errors.map(JSON.stringify).join('\n')}`
      )
    }
    // TODO: add your own gateways
  }
}
