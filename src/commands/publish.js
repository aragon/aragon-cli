const { ensureWeb3 } = require('../helpers/web3-fallback')
const fs = require('fs')
const tmp = require('tmp-promise')
const path = require('path')
const { promisify } = require('util')
const { copy, readJson, writeJson, pathExistsSync, existsSync } = require('fs-extra')
const extract = require('../helpers/solidity-extractor')
const APM = require('@aragon/apm')
const semver = require('semver')
const EthereumTx = require('ethereumjs-tx')
const namehash = require('eth-ens-namehash')
const { keccak256 } = require('js-sha3')
const TaskList = require('listr')
const { findProjectRoot, getNodePackageManager } = require('../util')
const ignore = require('ignore')
const execa = require('execa')
const { compileContracts } = require('../helpers/truffle-runner')

exports.command = 'publish [contract]'

exports.describe = 'Publish a new version of the application'

exports.builder = function (yargs) {
  return yargs.positional('contract', {
    description: 'The address of the contract to publish in this version'
  }).option('only-artifacts', {
    description: 'Whether just generate artifacts file without publishing',
    default: false,
    boolean: true
  }).option('provider', {
    description: 'The APM storage provider to publish files to',
    default: 'ipfs',
    choices: ['ipfs']
  }).option('files', {
    description: 'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
    default: ['.'],
    array: true
  }).option('ignore', {
    description: 'A gitignore pattern of files to ignore. Specify multiple times to add multiple patterns.',
    array: true
  }).option('skip-confirm', {
    description: 'Exit as soon as transaction is sent, do not wait for confirmation',
    default: false
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
  delete artifact.appName

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
  provider,
  key,
  files,
  ignore,
  skipArtifact
}) {
  return new TaskList([
    // TODO: Move this in to own file for reuse
    {
      title: 'Compile contracts',
      task: async () => (await compileContracts()),
      enabled: () => !alreadyCompiled
    },
    {
      title: 'Check project',
      task: () => new TaskList([
        {
          title: 'Check if directory is an Aragon app',
          task: (task) => {
            if (!module || !Object.keys(module).length) {
              throw new MessageError('This directory is not an Aragon app',
                'ERR_NOT_A_PROJECT')
            }

            return 'Directory is an Aragon app'
          }
        },
        {
          title: 'Check version is valid',
          task: () => {
            if (module && semver.valid(module.version)) {
              return `${module.version} is a valid version`
            }

            throw new MessageError(module
              ? `${module.version} is not a valid semantic version`
              : 'Could not determine version',
              'ERR_INVALID_VERSION')
          }
        }
      ], { concurrent: true })
    },
    {
      title: 'Determine contract address for version',
      task: (ctx, task) => {
        ctx.contract = contract

        // Check if we can fall back to a previous contract address
        if (!contract && module.version !== '1.0.0') {
          task.output = 'No contract address provided, using previous one'

          return ctx.apm.getLatestVersion(module.appName)
            .then(({ contract }) => {
              ctx.contract = contract

              return `Using ${contract}`
            })
            .catch(() => {
              throw new Error('Could not determine previous contract')
            })
        }

        // Contract address required for initial version
        if (!contract) {
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
      title: 'Prepare files for publishing',
      task: (ctx, task) => prepareFilesForPublishing(files, ignore)
        .then((pathToPublish) => {
          ctx.pathToPublish = pathToPublish

          return `Files copied to temporary directory: ${pathToPublish}`
        })
    },
    {
      title: 'Generate application artifact',
      task: (ctx, task) => {
        const dir = onlyArtifacts ? cwd : ctx.pathToPublish

        return generateApplicationArtifact(web3, cwd, dir, module, contract, reporter)
          .then((artifact) => {
            // reporter.debug(`Generated artifact: ${JSON.stringify(artifact)}`)
            // reporter.debug(`Saved artifact in ${dir}/artifact.json`)
          })
      },
      enabled: () => !skipArtifact
    },
    {
      title: `Publish ${module.appName} v${module.version}`,
      task: async (ctx, task) => {
        task.output = 'Generating transaction to sign'
        const accounts = await web3.eth.getAccounts()
        const from = accounts[0]

        try {
          return ctx.apm.publishVersion(
            from,
            module.appName,
            module.version,
            provider,
            ctx.pathToPublish,
            contract
          ).then((transaction) => {
            // Fix because APM.js gas comes with decimals and from doesn't work
            transaction.from = from
            transaction.gas = Math.round(transaction.gas)
            ctx.transactionStatus = web3.eth.sendTransaction(transaction)

            return 'Signed transaction to publish app'
          })
        } catch (e) {
          // reporter.error(e)
          throw new Error(e)
        } 
      },
      enabled: () => !onlyArtifacts
    },
    // TODO: Move this in to own file for reuse
    {
      title: 'Wait for confirmation',
      task: (ctx, task) => new Promise((resolve, reject) => {
        ctx.transactionStatus.on('transactionHash', (transactionHash) => {
          task.output = `Awaiting receipt for ${transactionHash}`
        }).on('receipt', (receipt) => {
          resolve(`Successfully published ${module.appName} v${module.version}`)
        }).on('error', (err) => {
          reject(err)
          // reporter.debug(err)
        })
      }),
      enabled: () => !onlyArtifacts && !skipArtifact
    }
  ])
}

exports.handler = async (args) => {
  const { apm: apmOptions, network } = args

  const web3 = await ensureWeb3(network)

  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const apm = APM(web3, apmOptions)

  return exports.task({ ...args, web3 }).run({ web3, apm })
}
