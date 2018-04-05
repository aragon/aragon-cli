const Web3 = require('web3')
const EthereumTx = require('ethereumjs-tx')
const APM = require('@aragon/apm')
const ACL = require('../acl')

exports.command = 'grant [address]'
exports.describe = 'Grant an address permission to create new versions in this package'

exports.builder = function (yargs) {
  return yargs.positional('address', {
    description: 'The address being granted the permission to publish to the repo'
  }).option('no-confirm', {
    description: 'Exit as soon as transaction is sent, no wait for confirmation',
    default: false
  })
}

exports.handler = async function ({
  // Globals
  reporter,
  cwd,
  ethRpc,
  keyfile,
  key,
  module,
  apm: apmOptions,

  // Arguments
  address,
  noConfirm
}) {
  const web3 = new Web3(keyfile.rpc ? keyfile.rpc : ethRpc)
  const privateKey = keyfile.key ? keyfile.key : key

  apmOptions.ensRegistry = !apmOptions.ensRegistry ? keyfile.ens : apmOptions.ensRegistry

  const apm = await APM(web3, apmOptions)
  const acl = ACL(web3)

  if (!module || !Object.keys(module).length) {
    throw new Error('This directory is not an Aragon project')
  }

  const repo = await apm.getRepository(module.appName)
    .catch(() => null)
  if (repo === null) {
    throw new Error(`Repository ${module.appName} does not exist and it's registry does not exist`)
  }

  reporter.info(`Granting permission to publish on ${module.appName} for ${address}`)

  // Decode sender
  const from = privateKey ? web3.eth.accounts.privateKeyToAccount('0x' + privateKey).address : null

  // Build transaction
  const transaction = await acl.grant(repo.options.address, address)

  if (from) {
    transaction.nonce = await web3.eth.getTransactionCount(from)
    transaction.from = from
  }

  if (!privateKey) {
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
    if (receipt.status === '0x1') {
      reporter.success(`Successful transaction ${receipt.transactionHash}`)
    } else {
      reporter.error(`Transaction reverted ${receipt.transactionHash}`)
    }
  }
}
