const test = require('ava')
const fsStorageProvider = require('../../../src/apm/storage/fs')

test('apm.storage.fs#getFile', (t) => {
  return fsStorageProvider.getFile('./test/fixtures/single-file', 'foo.txt')
    .then((contents) => t.is(contents, 'bar\n'))
})

test('apm.storage.fs#uploadFiles', (t) => {
  return fsStorageProvider.uploadFiles('/foo/bar')
    .then((uri) => t.is(uri, 'fs:/foo/bar'))
})
