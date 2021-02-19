import fs from 'fs-extra'
//
import { getLocalBinary, getBinary } from '../../src/node'

const TMP_DIR = '.tmp/node/os'
const LOCAL_PATH = `${TMP_DIR}/local`
const PARENT_PATH = `${TMP_DIR}/parent`

beforeAll(() => {
  fs.mkdirpSync(`${LOCAL_PATH}/node_modules/.bin`)
  fs.writeFileSync(`${LOCAL_PATH}/node_modules/.bin/truffle`, '')

  fs.mkdirpSync(`${PARENT_PATH}/node_modules/.bin`)
  fs.writeFileSync(`${PARENT_PATH}/node_modules/.bin/truffle`, '')

  // Create a child folder without truffle
  fs.mkdirpSync(`${PARENT_PATH}/node_modules/package/node_modules/.bin`)

  // Create scopped folder
  fs.mkdirpSync(`${PARENT_PATH}/node_modules/@scope/package/node_modules/.bin`)
})

test('fs.remove(TMP_DIR)', () => {
  fs.remove(TMP_DIR)
})

test('getLocalBinary should find the binary path from the local node_modules', () => {
  const binaryPath = getLocalBinary('truffle', LOCAL_PATH)

  expect(normalizePath(binaryPath)).toBe(
    `${LOCAL_PATH}/node_modules/.bin/truffle`
  )
})

test('getLocalBinary should find the binary path from the parent node_modules', () => {
  const binaryPath = getLocalBinary(
    'truffle',
    `${PARENT_PATH}/node_modules/package`
  )

  expect(normalizePath(binaryPath)).toBe(
    `${PARENT_PATH}/node_modules/.bin/truffle`
  )
})

test("getLocalBinary should find the binary path from the parent node_modules even when it's scoped", () => {
  const binaryPath = getLocalBinary(
    'truffle',
    `${PARENT_PATH}/node_modules/@scope/package`
  )

  expect(normalizePath(binaryPath)).toBe(
    `${PARENT_PATH}/node_modules/.bin/truffle`
  )
})

test('getBinary should find the binary path', () => {
  const binaryPath = getBinary(
    'truffle',
    `${PARENT_PATH}/node_modules/@scope/package`
  )

  expect(normalizePath(binaryPath)).toBe(
    `${PARENT_PATH}/node_modules/.bin/truffle`
  )
})

test('getBinary should return null on invalid path', () => {
  const binaryPath = getBinary(
    'invalid-binary',
    `${PARENT_PATH}/node_modules/@scope/package`
  )

  expect(binaryPath).toBe(null)
})

function normalizePath(path) {
  // on Windows the directory separator is '\' not '/'
  const next = path.replace(/\\/g, '/')
  return next
}
