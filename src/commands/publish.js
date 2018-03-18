const Web3 = require('web3')
const fs = require('fs')
const tmp = require('tmp-promise')
const path = require('path')
const { promisify } = require('util')
const { copy, readJson, writeJson } = require('fs-extra')
const { MessageError } = require('../errors')
const extract = require('../helpers/solidity-extractor')
const APM = require('../apm')
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
  }).option('only-artifacts', {
    description: 'Whether just generate artifacts file without publishing',
    default: false,
    boolean: true,
  }).option('provider', {
    description: 'The APM storage provider to publish files to',
    default: 'ipfs',
    choices: ['ipfs', 'fs']
  }).option('files', {
    description: 'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
    default: ['.'],
    array: true
  }).option('ignore', {
    description: 'A glob-like pattern of files to ignore. Specify multiple times to add multiple patterns.',
    array: true,
    default: ['node_modules/', '.git/']
  }).option('no-confirm', {
    description: 'Exit as soon as transaction is sent, no wait for confirmation',
    default: false
  })
  .option('no-contract', {
    description: 'Only upload content without generating artifacts',
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
  // TODO This relies heavily on the Truffle way of doing things, we should make it more flexible
  try {
    const contractInterface = await readJson(contractInterfacePath)
    artifact.abi = contractInterface.abi
  } catch (err) {
    throw new Error(`Could not read contract interface (at ${contractInterfacePath}). Did you remember to compile your contracts?`)
  }

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
  keyfile,
  module,
  apm: apmOptions,

  // Arguments
  contract,
  onlyArtifacts,
  provider,
  key,
  files,
  ignore,
  noConfirm,
  noContract
}) {
  const web3 = new Web3(keyfile.rpc ? keyfile.rpc : ethRpc)
  const privateKey = keyfile.key ? keyfile.key : key

  apmOptions.ensRegistry = !apmOptions.ensRegistry ? keyfile.ens : apmOptions.ensRegistry

  const apm = await APM(web3, apmOptions)

  if (!module || !Object.keys(module).length) {
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
      reporter.info('No contract address provided, defaulting to previous one...')
      const { contractAddress } = await apm.getLatestVersion(module.appName)
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

  if (!noContract) {
    const artifact = await generateApplicationArtifact(web3, cwd, dir, module, contract, reporter)
    reporter.debug(`Generated artifact: ${JSON.stringify(artifact)}`)

    // Save artifact
    reporter.debug(`Saved artifact in ${dir}/artifact.json`)

    if (onlyArtifacts) return
  }

  reporter.info(`Publishing ${module.appName} v${module.version}...`)
  reporter.debug(`Publishing "${pathToPublish}" with ${provider}`)
  reporter.debug(`Contract address: ${contract}`)

  const from = privateKey ? web3.eth.accounts.privateKeyToAccount('0x'+privateKey).address : null
  const transaction = await apm.publishVersion(module.appName, module.version, provider, pathToPublish, contract, from)

  if (!privateKey) {
    // Output transaction for signing if no key is provided
    reporter.info('Sign and broadcast this transaction')
    reporter.success(JSON.stringify(transaction))
  } else {
    // Sign and broadcast transaction
    reporter.debug('Signing transaction with passed private key...')

    const tx = new EthereumTx(transaction)
    tx.sign(Buffer.from(privateKey, 'hex'))
    const signed = '0x' + tx.serialize().toString('hex')

    const promisedReceipt = web3.eth.sendSignedTransaction(signed)
    if (noConfirm) return reporter.success('Transaction sent')

    const receipt = await promisedReceipt

    reporter.debug(JSON.stringify(receipt))
    if (receipt.status == '0x1') {
      reporter.success(`Successful transaction ${receipt.transactionHash}`)
    } else {
      reporter.error(`Transaction reverted ${receipt.transactionHash}`)
    }
  }
}
