import test from 'ava'
import fs from 'fs'
import path from 'path'
//
import findMissingManifestFiles from '../../src/publish/findMissingManifestFiles'

/* Tests */
test('findMissingManifestFiles', t => {
  const distPath = path.join(__dirname, 'release-sample')

  const manifest = {
    name: 'Finance',
    author: 'Aragon Association',
    description: "Manage an organization's financial assets",
    changelog_url: 'https://github.com/aragon/aragon-apps/releases',
    details_url: '/meta/details.md',
    source_url:
      'https://github.com/aragon/aragon-apps/blob/master/apps/finance',
    icons: [{ src: '/meta/icon.svg', sizes: '56x56' }],
    screenshots: [{ src: '/meta/screenshot-1.png' }],
    script: '/script.js',
    start_url: '/index.html',
  }

  const missingFiles = findMissingManifestFiles(manifest, distPath)
  // Remove dynamic path to make tests determistic
  const missingFilesWithoutDynamicPath = missingFiles.map(file => ({
    ...file,
    path: file.path.replace(__dirname, ''),
  }))

  t.deepEqual(missingFilesWithoutDynamicPath, [
    {
      path: '/release-sample/meta/details.md',
      id: 'details',
      required: false,
    },
    {
      path: '/release-sample/meta/icon.svg',
      id: 'icon 0',
      required: false,
    },
    {
      path: '/release-sample/meta/screenshot-1.png',
      id: 'screenshot 0',
      required: false,
    },
    {
      path: '/release-sample/script.js',
      id: 'script',
      required: true,
    },
  ])
})
