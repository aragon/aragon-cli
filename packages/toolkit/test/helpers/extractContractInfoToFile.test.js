import test from 'ava'
const path = require('path')
const fs = require('fs')
const tmp = require('tmp')
//
const extractContractInfoToFile = require('../../src/helpers/extractContractInfoToFile')

let tempDir, contractPath, outputPath

const readOutput = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile(outputPath, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(data.toString('utf8')))
      }
    })
  })
}

test.before('create a temp directory and resolve paths', t => {
  contractPath = path.resolve('test/helpers/contracts/ParseMe.sol')

  tempDir = tmp.dirSync({ unsafeCleanup: true, keep: false })
  const filename = path.basename(contractPath).replace('.sol', '.json')
  outputPath = path.resolve(tempDir.name, filename)
})

test.before('call extractContractInfoToFile function', async t => {
  await extractContractInfoToFile(contractPath, outputPath)
})

test('generates output', t => {
  t.true(fs.existsSync(outputPath))
})

test('output file contains 2 roles', async t => {
  const output = await readOutput()
  t.is(output.roles.length, 2)
})

test('output file contains 3 functions', async t => {
  const output = await readOutput()
  t.is(output.functions.length, 3)
})
