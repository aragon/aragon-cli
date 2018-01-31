const fs = require('fs')
const tmp = require('tmp-promise')
const path = require('path')
const { promisify } = require('util')
const { copy, readJson, writeJson } = require('fs-extra')
const { MessageError } = require('../errors')
const authExtractor = require('../helpers/auth-extractor')
const apm = require('../apm')
const semver = require('semver')
const EthereumTx = require('ethereumjs-tx')
const namehash = require('eth-ens-namehash')
const multimatch = require('multimatch')
const { keccak256 } = require('js-sha3')

exports.command = 'publish [contract]'

exports.describe = 'Publish a new version of the application'

exports.builder = function (yargs) {
  return yargs.positional('contract', {
    description: 'The address of the contract to publish in this version'
  }).option('key', {
    description: 'The private key to sign transactions with'
  }).option('onlyArtifacts', {
    description: 'Whether just generate artifacts file without publishing',
    default: false,
    boolean: true,
  }).option('provider', {
    description: 'The APM storage provider to publish files to',
    default: 'ipfs',
    choices: ['ipfs', 'fs']
  }).option('files', {
    description: 'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
    default: ['./app'],
    array: true
  }).option('ignore', {
    description: 'A glob-like pattern of files to ignore. Specify multiple times to add multiple patterns.',
    array: true,
    default: ['node_modules/', '.git/']
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
  // TODO This relies heavily on the Truffle way of doing things, we should make it more flexible
  try {
    const contractInterface = await readJson(contractInterfacePath)
    artifact.abi = contractInterface.abi
  } catch (err) {
    throw new Error(`Could not read contract interface (at ${contractInterfacePath}). Did you remember to compile your contracts?`)
  }

  // Analyse contract functions
  artifact.functions = await authExtractor(artifact.path)

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
  function filterIgnoredFiles (src, dest) {
    if (ignorePatterns === null) {
      return true
    }

    return multimatch(src, ignorePatterns, { matchBase: true }).length === 0
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

exports.handler = async function (reporter, {
  // Globals
  cwd,
  ethRpc,
  module,
  apm: apmOptions,

  // Arguments
  contract,
  onlyArtifacts,
  provider,
  key,
  files,
  ignore
}) {
  if (!Object.keys(module).length) {
    throw new MessageError('This directory is not an Aragon project',
      'ERR_NOT_A_PROJECT')
  }

  // Validate version
  if (!semver.valid(module.version)) {
    throw new MessageError(`${module.version} is not a valid semantic version`,
      'ERR_INVALID_VERSION')
  }

  if (!onlyArtifacts) {
    // Default to last published contract address if no address was passed
    if (!contract && module.version !== '1.0.0') {
      reporter.debug('No contract address provided, defaulting to previous one...')
      const { contractAddress } = await apm(ethRpc, apmOptions)
        .getLatestVersion(module.appName)
      contract = contractAddress
    }
  }

  // Prepare files for publishing
  reporter.info('Preparing files for publishing...')
  const pathToPublish = await prepareFilesForPublishing(files, ignore)
  reporter.debug(`Files copied to temporary directory: ${pathToPublish}`)

  // Generate the artifact
  reporter.info('Generating application artifact...')
  const dir = onlyArtifacts ? cwd : pathToPublish
  const artifact = await generateApplicationArtifact(ethRpc, cwd, dir, module, contract, reporter)
  reporter.debug(`Generated artifact: ${JSON.stringify(artifact)}`)

  // Save artifact
  reporter.info(`Saved artifact in ${dir}/artifact.json`)

  if (onlyArtifacts) return

  reporter.info(`Publishing version ${module.version}...`)
  reporter.debug(`Publishing "${pathToPublish}" with ${provider}`)
  reporter.debug(`Contract address: ${contract}`)
  const transaction = await apm(ethRpc, apmOptions)
    .publishVersion(module.appName, module.version, provider, pathToPublish, contract)

  if (!key) {
    // Output transaction for signing if no key is provided
    reporter.info('Sign and broadcast this transaction')
    reporter.success(JSON.stringify(transaction))
  } else {
    // Sign and broadcast transaction
    reporter.debug('Signing transaction with passed private key...')

    const tx = await ethRpc.eth.accounts.signTransaction(transaction, key)
    const receipt = await ethRpc.eth.sendSignedTransaction(
      tx
    )
    reporter.success(`Sent transaction ${receipt.transactionHash}`)
  }
}
