const findUp = require('find-up')
const { MessageError } = require('../errors')
const apm = require('../apm')

exports.command = 'versions'

exports.describe = 'List all versions of the package'

exports.handler = async function (reporter, { bump, cwd, ethRpc, ensRegistry }) {
  const moduleLocation = await findUp('module.json', { cwd })
  if (!moduleLocation) {
    throw new MessageError('This directory is not an Aragon project',
  'ERR_NOT_A_PROJECT')
  }

  return apm(ethRpc, ensRegistry).getAllVersions(module.appName)
    .then((versions) => {
      versions.forEach((version) => {
        const contentURI = Buffer.from(version.contentURI.substring(2), 'hex').toString('ascii')

        reporter.info(`${version.version}: ${contentURI}`)
      })
    })
}
