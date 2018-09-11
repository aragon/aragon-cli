const { ensureWeb3 } = require('../../helpers/web3-fallback')
const fs = require('fs-extra')
const findUp = require('find-up')
const semver = require('semver')
const APM = require('@aragon/apm')

const bumpVersionAndUpdateManifest = async ({ module, bump, cwd, apm }) => {

  let repo = { version: '0.0.0' }

  try {
    repo = await apm.getLatestVersion(module.appName)
  } catch (e) {

  }

  const manifestLocation = await findUp('arapp.json', { cwd })
  const manifest = fs.readJsonSync(manifestLocation)

  manifest.version = semver.valid(bump) ? semver.valid(bump) : semver.inc(repo.version, bump)

  if (!manifest.version) {
  	throw new Error('Invalid bump. Please use a version number or a valid bump (major, minor or patch)')
  }

  fs.writeJsonSync(manifestLocation, manifest, { spaces: 2 })
  return manifest.version
}

exports.bumpVersionAndUpdateManifest = bumpVersionAndUpdateManifest
exports.command = 'version [bump]'

exports.describe = 'Bump the application version'

exports.builder = function (yargs) {
  return yargs.positional('bump', {
    description: 'Type of bump (major, minor or patch) or version number',
    type: 'string',
    default: '1.0.0' 
  })
}

// TODO: Fix always default bump when network is not development
exports.handler = async function ({ reporter, bump, cwd, network, apm: apmOptions, module }) {

  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  const web3 = await ensureWeb3(network)
  const apm = APM(web3, apmOptions)

  const newVersion = await bumpVersionAndUpdateManifest({ module, bump, cwd, apm })

  reporter.success(`New version: ${newVersion}`)
  process.exit()
}
