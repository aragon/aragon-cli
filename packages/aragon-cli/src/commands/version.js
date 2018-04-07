const fs = require('fs')
const findUp = require('find-up')
const semver = require('semver')

exports.command = 'version <bump>'

exports.describe = 'Bump the application version'

exports.builder = function (yargs) {
  return yargs.positional('bump', {
    choices: ['major', 'minor', 'patch']
  })
}

exports.handler = async function ({ reporter, bump, cwd }) {
  const manifestLocation = await findUp('arapp.json', { cwd })
  if (!manifestLocation) {
    throw new Error('This directory is not an Aragon project')
  }

  let manifest = JSON.parse(fs.readFileSync(manifestLocation))
  manifest.version = semver.inc(manifest.version, bump)

  fs.writeFileSync(manifestLocation, JSON.stringify(manifest, null, 2))
  reporter.success(`New version: ${manifest.version}`)
}
