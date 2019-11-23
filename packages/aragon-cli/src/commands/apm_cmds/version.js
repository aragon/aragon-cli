import fs from 'fs'
import findUp from 'find-up'
import semver from 'semver'

export const command = 'version [bump]'
export const describe = '(deprecated) Bump the application version'

export const builder = function(yargs) {
  return yargs.positional('bump', {
    description: 'Type of bump (major, minor or patch) or version number',
    type: 'string',
    default: '1.0.0',
  })
}

// TODO: Fix always default bump when network is not development
export const handler = async function({ reporter, bump, cwd }) {
  const manifestLocation = await findUp('arapp.json', { cwd })

  const manifest = JSON.parse(fs.readFileSync(manifestLocation))

  if (manifest.environments) {
    throw new Error(
      'Deprecated: Your arapp.json contains an `environments` which no longer requires a `version` set in arapp.json.'
    )
  }

  manifest.version = semver.valid(bump)
    ? semver.valid(bump)
    : semver.inc(manifest.version, bump)

  if (!manifest.version) {
    throw new Error(
      'Invalid bump. Please use a version number or a valid bump (major, minor or patch)'
    )
  }

  fs.writeFileSync(manifestLocation, JSON.stringify(manifest, null, 2))
  reporter.success(`New version: ${manifest.version}`)
  process.exit()
}
