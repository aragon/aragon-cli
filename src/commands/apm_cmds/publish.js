const { ensureWeb3 } = require('../../helpers/web3-fallback')
const fs = require('fs')
const tmp = require('tmp-promise')
const path = require('path')
const { promisify } = require('util')
const { copy, readJson, writeJson, pathExistsSync, existsSync } = require('fs-extra')
const extract = require('../../helpers/solidity-extractor')
const APM = require('@aragon/apm')
const semver = require('semver')
const EthereumTx = require('ethereumjs-tx')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')
const TaskList = require('listr')
const { findProjectRoot, getNodePackageManager } = require('../../util')
const ignore = require('ignore')
const execa = require('execa')
const { compileContracts } = require('../../helpers/truffle-runner')
const web3Utils = require('web3-utils')
const deploy = require('../deploy')
const startIPFS = require('../ipfs')

exports.command = 'publish [contract]'

exports.describe = 'Publish a new version of the application'

exports.builder = function (yargs) {
  return yargs.positional('contract', {
    description: 'The address or name of the contract to publish in this version. If it isn\' provided, it will default to the current version\'s contract.'
  }).option('only-artifacts', {
    description: 'Whether just generate artifacts file without publishing',
    default: false,
    boolean: true
  }).option('provider', {
    description: 'The APM storage provider to publish files to',
    default: 'ipfs',
    choices: ['ipfs']
  }).option('reuse', {
    description: 'Whether to reuse the previous version contract and skip deployment on non-major versions',
    default: false,
    boolean: true
  }).option('files', {
    description: 'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
    default: ['.'],
    array: true
  }).option('ignore', {
    description: 'A gitignore pattern of files to ignore. Specify multiple times to add multiple patterns.',
    array: true
  })
}

async function generateApplicationArtifact (web3, cwd, outputPath, module, contract, reporter) {
  let artifact = Object.assign({}, module)
  const contractPath = artifact.path
  const contractInterfacePath = path.resolve(
    cwd, 'build/contracts', path.basename(
      contractPath, '.sol'
    ) + '.json'
  )

  // Set `appId`
  artifact.appId = namehash.hash(artifact.appName)

  // Set ABI
  const contractInterface = await readJson(contractInterfacePath)
  artifact.abi = contractInterface.abi

  // Analyse contract functions and returns an array
  // > [{ sig: 'transfer(address)', role: 'X_ROLE', notice: 'Transfers..'}]
  artifact.functions = await extract(artifact.path)

  artifact.roles = artifact.roles
    .map(role => Object.assign(role, { bytes: '0x'+keccak256(role.id) }))

  // Save artifact
  await writeJson(
    path.resolve(outputPath, 'artifact.json'),
    artifact,
    { spaces: '\t' }
  )

  return artifact
}

/**
 * Moves the specified files to a temporary directory and returns the path to
 * the temporary directory.
 *
 * @param {Array<string>} files An array of file paths to include
 * @param {string} ignorePatterns An array of glob-like pattern of files to ignore
 * @return {string} The path to the temporary directory
 */
async function prepareFilesForPublishing (files = [], ignorePatterns = null) {
  // Create temporary directory
  const { path: tmpDir } = await tmp.dir()

  // Ignored files filter
  const filter = ignore()
    .add(ignorePatterns)
  
  const gitignorePath = path.resolve(
    findProjectRoot(),
    '.gitignore'
  )

  if (pathExistsSync(gitignorePath)) {
    filter
      .add(fs.readFileSync(gitignorePath).toString())
  }

  function filterIgnoredFiles (src) {
    return !filter.ignores(src)
  }

  // Copy files
  await Promise.all(
    files.map(async (file) => {
      const stats = await promisify(fs.lstat)(file)

      let destination = tmpDir
      if (stats.isFile()) {
        destination = path.resolve(tmpDir, file)
      }

      return copy(file, destination, {
        filter: filterIgnoredFiles
      })
    })
  )

  return tmpDir
}

exports.task = function ({
  reporter,

  // Globals
  cwd,
  web3,
  network,
  module,
  apm: apmOptions,

  // Arguments

  contract,
  onlyArtifacts,
  alreadyCompiled,
  reuse,
  provider,
  key,
  files,
  ignore,
  automaticallyBump
}) {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)
  return new TaskList([
    {
      title: 'Preflight checks for publishing to APM',
      enabled: () => !automaticallyBump,
      task: (ctx) => new TaskList([
        {
          title: 'Check version is valid',
          task: (ctx) => {
            if (module && semver.valid(module.version)) {
              ctx.version = module.version
              return `${module.version} is a valid version`
            }

            throw new MessageError(module
              ? `${module.version} is not a valid semantic version`
              : 'Could not determine version',
              'ERR_INVALID_VERSION')
          }
        },
        {
          title: 'Checking version bump',
          task: async (ctx) => {
            let repo = { version: '0.0.0' }
            try {
              repo = await apm.getLatestVersion(module.appName)
            } catch (e) {
              if (apm.validInitialVersions.indexOf(ctx.version) == -1) {
                throw new Error('Invalid initial version, it can only be 0.0.1, 0.1.0 or 1.0.0. Check your arapp file.')
              } else {
                ctx.isMajor = true // consider first version as major
                return
              }
            }

            if (ctx.version == repo.version) {
              throw new Error('Version is already published, please bump it using `aragon apm version [major, minor, patch]`')
            }

            const isValid = await apm.isValidBump(module.appName, repo.version, ctx.version)

            if (!isValid) {
              throw new Error('Version bump is not valid, you have to respect APM bumps policy. Check version upgrade rules in documentation https://hack.aragon.one/docs/aragonos-ref.html#631-version-upgrade-rules')
            }

            const getMajor = version => version.split('.')[0]
            ctx.isMajor = getMajor(repo.version) != getMajor(ctx.version)
          }
        }
      ])
    },
    {
      title: 'Compile contracts',
      task: async () => (await compileContracts()),
      enabled: () => web3Utils.isAddress(contract)
    },
    {
      title: 'Deploy contract',
      task: async (ctx) => {
        const deployTaskParams = { contract: deploy.arappContract(), reporter, network, cwd, web3 }
        
        return await deploy.task(deployTaskParams)
      },
      enabled: ctx => (contract && !web3Utils.isAddress(contract)) || (!contract && ctx.isMajor && !reuse) || automaticallyBump
    },
    {
      title: 'Automatically bump version',
      task: async (ctx, task) => {
        let nextMajorVersion
        try {
          const { version } = await apm.getLatestVersion(module.appName)
          nextMajorVersion = parseInt(version.split('.')[0]) + 1
        } catch (_) {
          ctx.version = '1.0.0'
          return task.skip('Starting from initial version')
        }
        
        ctx.version = `${nextMajorVersion}.0.0`
      },
      enabled: () => automaticallyBump
    },
    {
      title: 'Determine contract address for version',
      task: async (ctx, task) => {
        if (web3Utils.isAddress(contract)) {
          ctx.contract = contract
        }

        // Check if we can fall back to a previous contract address
        if (!ctx.contract && ctx.version !== '1.0.0') {
          task.output = 'No contract address provided, using previous one'

          try {
            const { contract } = apm.getLatestVersion(module.appName)
            ctx.contract = contract
            return `Using ${contract}`
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
      enabled: () => !onlyArtifacts
    },
    {
      title: 'Building frontend',
      task: async (ctx, task) => {
        if (!fs.existsSync('package.json')) {
          task.skip('No package.json found')
          return
        }

        const packageJson = await readJson('package.json')
        const scripts = packageJson.scripts || {}
        if (!scripts.build) {
          task.skip('No build script defined in package.json')
          return
        }

        const bin = await getNodePackageManager()
        const buildTask = execa(bin, ['run', 'build'])
        buildTask.stdout.on('data', (log) => {
          if (!log) return
          task.output = log
        })

        return buildTask.catch((err) => {
            throw new Error(`${err.message}\n${err.stderr}\n\nFailed to build. See above output.`)
          })
      }
    },
    {
      title: 'Check IPFS',
      task: () => startIPFS.task({ apmOptions }),
    },
    {
      title: 'Prepare files for publishing',
      task: async (ctx, task) => {
        const pathToPublish = await prepareFilesForPublishing(files, ignore)
        ctx.pathToPublish = pathToPublish

        return `Files copied to temporary directory: ${pathToPublish}`
      }
    },
    {
      title: 'Generate application artifact',
      task: async (ctx, task) => {
        const dir = onlyArtifacts ? cwd : ctx.pathToPublish
        const artifact = await generateApplicationArtifact(web3, cwd, dir, module, contract, reporter)
        reporter.debug(`Generated artifact: ${JSON.stringify(artifact)}`)
        reporter.info(`Saved artifact in ${dir}/artifact.json`)
      }
    },
    {
      title: `Publish ${module.appName}`,
      task: async (ctx, task) => {
        task.output = 'Generating transaction and waiting for confirmation'
        const accounts = await web3.eth.getAccounts()
        const from = accounts[0]

        try {
          const transaction = await apm.publishVersion(
            from,
            module.appName,
            ctx.version,
            provider,
            ctx.pathToPublish,
            ctx.contract,
            from
          )
          // Fix because APM.js gas comes with decimals and from doesn't work
          transaction.from = from
          transaction.gas = Math.round(transaction.gas)
          
          return await web3.eth.sendTransaction(transaction)
        } catch (e) {
          const errMsg = `${e}\nThis is usually one of these reasons, maybe:
          - An existing version of this package was already deployed, try running 'aragon version' to bump it
          - You are deploying a version higher than the one in the chain`
          throw new Error(e)
        } 
      },
      enabled: () => !onlyArtifacts
    }
  ])
}

exports.handler = async (args) => {
  const { apm: apmOptions, network, reporter, module } = args

  const web3 = await ensureWeb3(network)

  return exports.task({ ...args, web3 }).run({ web3 })
    .then(() => { process.exit() })
    .catch(() => { process.exit() })
}
