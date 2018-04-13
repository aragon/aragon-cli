const Web3 = require('web3')
const findUp = require('find-up')
const APM = require('@aragon/apm')

exports.command = 'versions'

exports.describe = 'List all versions of the package'

exports.handler = async function ({ reporter, module, bump, cwd, keyfile, ethRpc, apm: apmOptions }) {
  const web3 = new Web3(keyfile.rpc ? keyfile.rpc : ethRpc)

  apmOptions.ensRegistry = !apmOptions.ensRegistry ? keyfile.ens : apmOptions.ensRegistry

  const moduleLocation = await findUp('arapp.json', { cwd })
  if (!moduleLocation) {
    throw new Error('This directory is not an Aragon project')
  }

  return APM(web3, apmOptions).getAllVersions(module.appName)
    .then((versions) => {
      reporter.info(`${module.appName} has ${versions.length} published versions`)
      versions.forEach((version) => {
        reporter.success(`${version.version}: ${version.contractAddress} ${version.content.provider}:${version.content.location}`)
      })
    })
}
