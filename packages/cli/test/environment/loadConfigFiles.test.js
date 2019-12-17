import test from 'ava'
import fs from 'fs'
//
import {
  loadArappFile,
  loadManifestFile,
} from '../../src/lib/environment/loadConfigFiles'

const arappPath = 'arapp.json'
const manifestPath = 'manifest.json'

const tryUnlink = filepath => {
  try {
    fs.unlinkSync(filepath)
  } catch (e) {}
}

test.after.always(() => {
  tryUnlink(arappPath)
  tryUnlink(manifestPath)
})

test('Return undefined if files are NOT found', t => {
  t.is(loadArappFile(), undefined)
  t.is(loadManifestFile(), undefined)
})

test('Return file contents if files are found', t => {
  const arapp = {
    environments: {
      develop: {
        appName: 'finance.aragonpm.eth',
        network: 'develop',
      },
    },
  }
  fs.writeFileSync(arappPath, JSON.stringify(arapp))
  fs.writeFileSync(manifestPath, JSON.stringify(arapp))

  t.deepEqual(loadArappFile(), arapp)
  t.deepEqual(loadManifestFile(), arapp)
})
