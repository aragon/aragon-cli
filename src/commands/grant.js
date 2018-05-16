const Web3 = require('web3')
const EthereumTx = require('ethereumjs-tx')
const APM = require('@aragon/apm')
const ACL = require('../acl')
const { ensureWeb3 } = require('../helpers/web3-fallback')

exports.command = 'grant [address]'
exports.describe = 'Grant an address permission to create new versions in this package'

exports.builder = function (yargs) {
  return yargs.positional('address', {
    description: 'The address being granted the permission to publish to the repo'
  })
}

exports.handler = async function ({
  // Globals
  reporter,
  cwd,
  network,
  module,
  apm: apmOptions,

  // Arguments
  address
}) {
  const web3 = await ensureWeb3(network)
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const apm = await APM(web3, apmOptions)
  const acl = ACL(web3)

  const repo = await apm.getRepository(module.appName).catch(() => null)
  if (repo === null) {
    throw new Error(`Repository ${module.appName} does not exist and it's registry does not exist`)
  }

  reporter.info(`Granting permission to publish on ${module.appName} for ${address}`)

  // Decode sender
  const accounts = await web3.eth.getAccounts()
  const from = accounts[0]

  // Build transaction
  const transaction = await acl.grant(repo.options.address, address)

  transaction.nonce = await web3.eth.getTransactionCount(from)
  transaction.from = from

  try {
    const receipt = await web3.eth.sendTransaction(transaction)
    reporter.success(`Successful transaction (${receipt.transactionHash})`)
  } catch (e) {
    reporter.error(`${e}\nTransaction failed (${receipt.transactionHash})`)
  }
  process.exit()

  // reporter.debug(JSON.stringify(receipt))
}
