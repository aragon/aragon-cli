import test from 'ava'
import fs from 'fs'
import path from 'path'
//
import parseFunctions from '../../src/solidityParsers/parseFunctions'

/* Tests */
test('Parse AST of Finance.sol', t => {
  const sourceCode = fs.readFileSync(
    path.join(__dirname, 'Finance.sol'),
    'utf8'
  )

  const functions = parseFunctions(sourceCode)

  console.log(JSON.stringify(functions, null, 2))

  // t.is(functions, [])
})
