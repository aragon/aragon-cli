const Web3 = require('web3')
const findUp = require('find-up')
const { MessageError } = require('../errors')
const apm = require('../apm')

exports.command = 'versions'

exports.describe = 'List all versions of the package'

exports.handler = async function (reporter, { module, bump, cwd, keyfile, ethRpc, apm: apmOptions }) {
  const web3 = new Web3(keyfile.rpc ? keyfile.rpc : ethRpc)

  const moduleLocation = await findUp('arapp.json', { cwd })
  if (!moduleLocation) {
    throw new MessageError('This directory is not an Aragon project',
  'ERR_NOT_A_PROJECT')
  }

  return apm(web3, apmOptions).getAllVersions(module.appName)
    .then((versions) => {
      reporter.info(`${module.appName} has ${versions.length} published versions`)
      versions.forEach((version) => {
        reporter.success(`${version.version}: ${version.contractAddress} ${version.content.provider}:${version.content.location}`)
      })
    })
}
