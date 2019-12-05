import test from 'ava'
const path = require('path')
const fs = require('fs')
const tmp = require('tmp')
const extractContractInfoToFile = require('../../src/apm/extractContractInfoToFile')

let tempDir, contractPath, outputPath

const readOutput = () => JSON.parse(fs.readFileSync(outputPath, 'utf8'))

test.before('create a temp directory and resolve paths', t => {
  contractPath = path.resolve('test/contracts/ParseMe.sol')

  tempDir = tmp.dirSync({ unsafeCleanup: true })
  const filename = path.basename(contractPath).replace('.sol', '.json')
  outputPath = path.resolve(tempDir.name, filename)
})

test.before('call extractContractInfoToFile function', async t => {
  await extractContractInfoToFile(contractPath, outputPath)
})

test.after('remove temp directory', t => {
  tempDir.removeCallback()
})

test('generates output', t => {
  t.true(fs.existsSync(outputPath))
})

test('output file contains 2 roles', t => {
  const output = readOutput()
  t.is(output.roles.length, 2)
})

test('output file contains 3 functions', t => {
  const output = readOutput()
  t.is(output.functions.length, 3)
})
