import test from 'ava'
import fs from 'fs-extra'
//
import { getLocalBinary, getBinary } from '../../src/lib/node'

const TMP_DIR = '.tmp/node/os'
const LOCAL_PATH = `${TMP_DIR}/local`
const PARENT_PATH = `${TMP_DIR}/parent`

test.before(t => {
  fs.mkdirpSync(`${LOCAL_PATH}/node_modules/.bin`)
  fs.writeFileSync(`${LOCAL_PATH}/node_modules/.bin/truffle`, '')

  fs.mkdirpSync(`${PARENT_PATH}/node_modules/.bin`)
  fs.writeFileSync(`${PARENT_PATH}/node_modules/.bin/truffle`, '')

  // Create a child folder without truffle
  fs.mkdirpSync(`${PARENT_PATH}/node_modules/package/node_modules/.bin`)

  // Create scopped folder
  fs.mkdirpSync(`${PARENT_PATH}/node_modules/@scope/package/node_modules/.bin`)
})

test.after.always(() => {
  fs.remove(TMP_DIR)
})

test('getLocalBinary should find the binary path from the local node_modules', t => {
  const binaryPath = getLocalBinary('truffle', LOCAL_PATH)

  t.is(normalizePath(binaryPath), `${LOCAL_PATH}/node_modules/.bin/truffle`)
})

test('getLocalBinary should find the binary path from the parent node_modules', t => {
  const binaryPath = getLocalBinary(
    'truffle',
    `${PARENT_PATH}/node_modules/package`
  )

  t.is(normalizePath(binaryPath), `${PARENT_PATH}/node_modules/.bin/truffle`)
})

test("getLocalBinary should find the binary path from the parent node_modules even when it's scoped", t => {
  const binaryPath = getLocalBinary(
    'truffle',
    `${PARENT_PATH}/node_modules/@scope/package`
  )

  t.is(normalizePath(binaryPath), `${PARENT_PATH}/node_modules/.bin/truffle`)
})

test('getBinary should find the binary path', t => {
  const binaryPath = getBinary(
    'truffle',
    `${PARENT_PATH}/node_modules/@scope/package`
  )

  t.is(normalizePath(binaryPath), `${PARENT_PATH}/node_modules/.bin/truffle`)
})

test('getBinary should return null on invalid path', t => {
  const binaryPath = getBinary(
    'invalid-binary',
    `${PARENT_PATH}/node_modules/@scope/package`
  )

  t.is(binaryPath, null)
})

function normalizePath(path) {
  // on Windows the directory separator is '\' not '/'
  const next = path.replace(/\\/g, '/')
  return next
}
