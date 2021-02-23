import fs from 'fs'
//
import {
  loadArappFile,
  loadManifestFile,
} from '../../src/lib/environment/loadConfigFiles'

const arappPath = 'arapp.json'
const manifestPath = 'manifest.json'

const tryUnlink = (filepath) => {
  try {
    fs.unlinkSync(filepath)
  } catch (e) {}
}

test('tryUnlink', () => {
  tryUnlink(arappPath)
  tryUnlink(manifestPath)
})

test('Return undefined if files are NOT found', () => {
  expect(loadArappFile()).toBe(undefined)
  expect(loadManifestFile()).toBe(undefined)
})

test('Return file contents if files are found', () => {
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

  expect(loadArappFile()).toEqual(arapp)
  expect(loadManifestFile()).toEqual(arapp)
})
