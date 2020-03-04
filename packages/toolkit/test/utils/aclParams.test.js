import test from 'ava'
//
import {
  convertStringToParam,
  encodeParam,
  Op,
} from '../../src/utils/aclParams'
import BN from 'bn.js'

// decode uint256 string to ACL parameter
function decodeParam(encodedParam) {
  const maskUint8 = new BN('FF', 16)
  const maskUint240 = new BN('FF'.repeat(30), 16)
  const id = new BN(encodedParam).and(maskUint8.shln(248)).shrn(248)
  const op = new BN(encodedParam).and(maskUint8.shln(240)).shrn(240)
  const value = new BN(encodedParam).and(maskUint240)
  return { id: id.toString(), op: op.toString(), value: value.toString() }
}

test('simple parameter', t => {
  const param = convertStringToParam('0, GT, 42')
  const encodedParam = encodeParam(param)

  t.is(param.id, '0')
  t.is(param.op, Op.GT)
  t.is(param.value, '42')

  t.is(
    encodedParam,
    '5300541194335152988749892502228755547482451690626856874364818603877859370'
  )
})

test('lowercase operator, spaces variations', t => {
  const param = convertStringToParam('1,lt,  5')
  const encodedParam = encodeParam(param)

  t.is(param.id, '1')
  t.is(param.op, Op.LT)
  t.is(param.value, '5')

  t.is(
    encodedParam,
    '459380236842379925691657350193158814115145813187660929111617612336081141765'
  )
})

test('hex value', t => {
  const param = convertStringToParam(
    '2, EQ, 0xC7f8dDbc7B3BFd432dEAc0CA270110467EcE01c3'
  )
  const encodedParam = encodeParam(param)

  t.is(param.id, '2')
  t.is(param.op, Op.EQ)
  t.is(param.value, '0xC7f8dDbc7B3BFd432dEAc0CA270110467EcE01c3')

  t.is(
    encodedParam,
    '906392544231311161076231619022756262774761324877954494358762516206068826563'
  )
})

test('logic operator with 2 values', t => {
  const param = convertStringToParam('LOGIC_OP_PARAM_ID, OR, (1,2)')
  const encodedParam = encodeParam(param)

  t.is(param.id, '204')
  t.is(
    encodedParam,
    '92289489581634127071453961653805605755732793869401080658523978318327291314177'
  )
})

test('logic operator with 3 values', t => {
  const param = convertStringToParam('LOGIC_OP_PARAM_ID, IF_ELSE, (1,2,3)')
  const encodedParam = encodeParam(param)

  t.is(
    encodedParam,
    '92293023275763683840113128248807091592764448837194831896495561762951005208577'
  )
})

test('convertStringToParam throws if logic operator has more than 3 values', t => {
  t.throws(() =>
    convertStringToParam('LOGIC_OP_PARAM_ID, IF_ELSE, (1, 2, 3, 4)')
  )
})

test('convertStringToParam throws if receives random string as input', t => {
  t.throws(() => convertStringToParam('random_string_with_no_meaning'))
})

test('encodeParam encodes base 10 and 16 strings and numbers', t => {
  // base 16 number as string
  let encodedOutput = encodeParam({ id: '1', op: '2', value: '0x11' })
  let decodedOutput = decodeParam(encodedOutput)
  t.true(decodedOutput.id === '1')
  t.true(decodedOutput.op === '2')
  t.true(decodedOutput.value === '17') // 0x11 in base 10

  // base 16 number
  encodedOutput = encodeParam({ id: '2', op: '3', value: 0x11 })
  decodedOutput = decodeParam(encodedOutput)
  t.true(decodedOutput.id === '2')
  t.true(decodedOutput.op === '3')
  t.true(decodedOutput.value === '17') // 0x11 in base 10

  // base 10 number as string
  encodedOutput = encodeParam({ id: '4', op: '5', value: '11' })
  decodedOutput = decodeParam(encodedOutput)
  t.true(decodedOutput.id === '4')
  t.true(decodedOutput.op === '5')
  t.true(decodedOutput.value === '11')

  // base 10 number
  encodedOutput = encodeParam({ id: '6', op: '7', value: 11 })
  decodedOutput = decodeParam(encodedOutput)
  t.true(decodedOutput.id === '6')
  t.true(decodedOutput.op === '7')
  t.true(decodedOutput.value === '11')
})
