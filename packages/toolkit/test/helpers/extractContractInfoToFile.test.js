import path from 'path'
import fs from 'fs'
import tmp from 'tmp'
//
import extractContractInfoToFile from '../../src/helpers/extractContractInfoToFile'

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

beforeAll(() => {
  contractPath = path.resolve('test/helpers/contracts/ParseMe.sol')

  tempDir = tmp.dirSync({ unsafeCleanup: true, keep: false })
  const filename = path.basename(contractPath).replace('.sol', '.json')
  outputPath = path.resolve(tempDir.name, filename)
})

beforeAll(async () => {
  await extractContractInfoToFile(contractPath, outputPath)
})

test('generates output', () => {
  expect(fs.existsSync(outputPath)).toBe(true)
})

test('output file contains 2 roles', async () => {
  const output = await readOutput()
  expect(output.roles.length).toBe(2)
})

test('output file contains 3 functions', async () => {
  const output = await readOutput()
  expect(output.functions.length).toBe(3)
})
