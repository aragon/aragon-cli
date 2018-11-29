const { ensureWeb3 } = require('../../helpers/web3-fallback')
const fs = require('fs')
const tmp = require('tmp-promise')
const path = require('path')
const { promisify } = require('util')
const { copy, readJson, writeJson, pathExistsSync } = require('fs-extra')
const extract = require('../../helpers/solidity-extractor')
const APM = require('@aragon/apm')
const semver = require('semver')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')
const TaskList = require('listr')
const taskInput = require('listr-input')
const { findProjectRoot, getNodePackageManager } = require('../../util')
const ignore = require('ignore')
const execa = require('execa')
const { compileContracts } = require('../../helpers/truffle-runner')
const web3Utils = require('web3-utils')
const deploy = require('../deploy')
const startIPFS = require('../ipfs')
const getRepoTask = require('../dao_cmds/utils/getRepoTask')
const listrOpts = require('../../helpers/listr-options')

const DEFAULT_GAS_PRICE = require('../../../package.json').aragon
  .defaultGasPrice
const MANIFEST_FILE = 'manifest.json'
const ARTIFACT_FILE = 'artifact.json'
const SOLIDITY_FILE = 'code.sol'

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
      description: 'The APM storage provider to publish files to',
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

async function generateApplicationArtifact(
  cwd,
  outputPath,
  module,
  deployArtifacts
) {
  let artifact = Object.assign({}, module)
  const contractPath = artifact.path
  const contractInterfacePath = path.resolve(
    cwd,
    'build/contracts',
    path.basename(contractPath, '.sol') + '.json'
  )

  // Set `appId`
  artifact.appId = namehash.hash(artifact.appName)

  // Set ABI
  const contractInterface = await readJson(contractInterfacePath)
  artifact.abi = contractInterface.abi

  if (deployArtifacts) {
    artifact.deployment = deployArtifacts
    if (deployArtifacts.flattenedCode) {
      fs.writeFileSync(
        path.resolve(outputPath, SOLIDITY_FILE),
        artifact.deployment.flattenedCode
      )
      artifact.deployment.flattenedCode = `./${SOLIDITY_FILE}`
    }
  }

  // Analyse contract functions and returns an array
  // > [{ sig: 'transfer(address)', role: 'X_ROLE', notice: 'Transfers..'}]
  artifact.functions = await extract(path.resolve(cwd, artifact.path))

  artifact.roles = artifact.roles.map(role =>
    Object.assign(role, { bytes: '0x' + keccak256(role.id) })
  )

  // Save artifact
  await writeJson(path.resolve(outputPath, 'artifact.json'), artifact, {
    spaces: '\t',
  })

  return artifact
}

async function copyCurrentApplicationArtifacts(
  outputPath,
  apm,
  repo,
  newVersion
) {
  const copyingFiles = [ARTIFACT_FILE, SOLIDITY_FILE]
  const { content } = repo
  const uri = `${content.provider}:${content.location}`

  const copy = await Promise.all(
    copyingFiles.map(async file => {
      try {
        return {
          filePath: path.resolve(outputPath, file),
          fileContent: await apm.getFile(uri, file),
          fileName: file,
        }
      } catch (e) {
        // Only throw if fetching artifact fails, if code can't be found
        // continue as it could be fetched from previous versions
        if (file === ARTIFACT_FILE) {
          throw e
        }
      }
    })
  )

  const updateArtifactVersion = (file, version) => {
    const newContent = JSON.parse(file.fileContent)
    newContent.version = version
    return { ...file, fileContent: JSON.stringify(newContent, null, 2) }
  }

  copy
    .filter(item => item)
    .map(file => {
      if (file.fileName === ARTIFACT_FILE) {
        return updateArtifactVersion(file, newVersion)
      }
      return file
    })
    .forEach(({ fileName, filePath, fileContent }) =>
      fs.writeFileSync(filePath, fileContent)
    )
}

/**
 * Moves the specified files to a temporary directory and returns the path to
 * the temporary directory.
 * @param {string} tmpDir Temporary directory
 * @param {Array<string>} files An array of file paths to include
 * @param {string} ignorePatterns An array of glob-like pattern of files to ignore
 * @return {string} The path to the temporary directory
 */
async function prepareFilesForPublishing(
  tmpDir,
  files = [],
  ignorePatterns = null
) {
  // Ignored files filter
  const filter = ignore().add(ignorePatterns)
  const projectRoot = findProjectRoot()

  const ipfsignorePath = path.resolve(projectRoot, '.ipfsignore')
  if (pathExistsSync(ipfsignorePath)) {
    filter.add(fs.readFileSync(ipfsignorePath).toString())
  } else {
    const gitignorePath = path.resolve(projectRoot, '.gitignore')

    if (pathExistsSync(gitignorePath)) {
      filter.add(fs.readFileSync(gitignorePath).toString())
    }
  }

  const replaceRootRegex = new RegExp(`^${projectRoot}`)
  function filterIgnoredFiles(src) {
    const relativeSrc = src.replace(replaceRootRegex, '.')
    return !filter.ignores(relativeSrc)
  }

  // Copy files
  await Promise.all(
    files.map(async file => {
      const stats = await promisify(fs.lstat)(file)

      let destination = tmpDir
      if (stats.isFile()) {
        destination = path.resolve(tmpDir, file)
      }

      return copy(file, destination, {
        filter: filterIgnoredFiles,
      })
    })
  )

  const manifestOrigin = path.resolve(projectRoot, MANIFEST_FILE)
  const manifestDst = path.resolve(tmpDir, MANIFEST_FILE)

  if (!pathExistsSync(manifestDst) && pathExistsSync(manifestOrigin)) {
    await copy(manifestOrigin, manifestDst)
  }

  const artifactOrigin = path.resolve(projectRoot, ARTIFACT_FILE)
  const artifactDst = path.resolve(tmpDir, ARTIFACT_FILE)

  if (!pathExistsSync(artifactDst) && pathExistsSync(artifactOrigin)) {
    await copy(artifactOrigin, artifactDst)
  }

  return tmpDir
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
  module,
  apm: apmOptions,
  silent,
  debug,

  // Arguments

  bump,
  contract,
  onlyArtifacts,
  alreadyCompiled,
  reuse,
  provider,
  key,
  files,
  ignore,
  ipfsCheck,
  publishDir,
  init,
  getRepo,
  onlyContent,
  build,
  buildScript,
  http,
  httpServedFrom,
}) {
  if (onlyContent) {
    contract = '0x0000000000000000000000000000000000000000'
  }

  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)
  let repo = { version: '0.0.0' }

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
            repo = await apm.getLatestVersion(module.appName)
            ctx.version = semver.valid(bump)
              ? semver.valid(bump)
              : semver.inc(repo.version, bump)

            const getMajor = version => version.split('.')[0]
            ctx.isMajor = getMajor(repo.version) !== getMajor(ctx.version)

            isValid = await apm.isValidBump(
              module.appName,
              repo.version,
              ctx.version
            )
          } catch (e) {
            if (e.message.indexOf('Invalid content URI') === 0) {
              return
            }
            ctx.version = semver.valid(bump)
              ? semver.valid(bump)
              : semver.inc(repo.version, bump)
            if (apm.validInitialVersions.indexOf(ctx.version) === -1) {
              throw new Error(
                'Invalid initial version, it can only be 0.0.1, 0.1.0 or 1.0.0.'
              )
            } else {
              ctx.isMajor = true // consider first version as major
            }
          }

          if (!isValid) {
            throw new Error(
              'Version bump is not valid, you have to respect APM bumps policy. Check version upgrade rules in documentation https://hack.aragon.org/docs/aragonos-ref.html#631-version-upgrade-rules'
            )
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
            (!contract && ctx.isMajor && !reuse)),
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
              `${err.message}\n${
                err.stderr
              }\n\nFailed to build. See above output.`
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
          const dir = onlyArtifacts ? cwd : ctx.pathToPublish

          if (pathExistsSync(`${dir}/${ARTIFACT_FILE}`)) {
            return task.skip('Using existent artifact')
          }

          if (onlyContent) {
            try {
              task.output = 'Fetching artifacts from previous version'
              await copyCurrentApplicationArtifacts(
                dir,
                apm,
                ctx.repo,
                ctx.version
              )
              return task.skip(`Using artifacts from v${ctx.repo.version}`)
            } catch (e) {
              return taskInput(
                "Couldn't fetch existing artifact, generate now? [y]es/[a]bort",
                {
                  validate: value => {
                    return ANSWERS.indexOf(value) > -1
                  },
                  done: async answer => {
                    if (POSITIVE_ANSWERS.indexOf(answer) > -1) {
                      await generateApplicationArtifact(
                        cwd,
                        dir,
                        module,
                        ctx.deployArtifacts
                      )
                      return `Saved artifact in ${dir}/artifact.json`
                    }
                    throw new Error('Aborting publication...')
                  },
                }
              )
            }
          }
          await generateApplicationArtifact(
            cwd,
            dir,
            module,
            ctx.deployArtifacts
          )
          return `Saved artifact in ${dir}/artifact.json`
        },
      },
      {
        title: `Publish ${module.appName}`,
        task: async (ctx, task) => {
          ctx.contractInstance = null // clean up deploy sub-command artifacts

          task.output = 'Generating transaction and waiting for confirmation'
          const accounts = await web3.eth.getAccounts()
          const from = accounts[0]

          try {
            const transaction = await apm.publishVersion(
              from,
              module.appName,
              ctx.version,
              http ? 'http' : provider,
              http || ctx.pathToPublish,
              ctx.contract,
              from
            )

            transaction.from = from
            transaction.gasPrice = network.gasPrice || DEFAULT_GAS_PRICE

            ctx.receipt = await web3.eth.sendTransaction(transaction)
          } catch (e) {
            throw e
          }
        },
        enabled: () => !onlyArtifacts,
      },
      {
        title: 'Fetch published repo',
        task: getRepoTask.task({
          artifactRequired: false,
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

      console.log()
      if (!status) {
        reporter.error(`Publish transaction reverted:`)
      } else {
        reporter.success(`Successfully published ${appName} v${version}: `)
        if (!onlyContent) {
          reporter.info(`Contract address: ${contractAddress}`)
        }
        reporter.info(`Content (${content.provider}): ${content.location}`)
      }

      reporter.info(`Transaction hash: ${transactionHash}`)
      reporter.debug(`Published directory: ${ctx.pathToPublish}`)
      process.exit(status ? 0 : 1)
    })
    .catch(() => {
      process.exit(1)
    })
}
