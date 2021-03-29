import { convertStringToParam, encodeParam, Op } from '../../src/acl/params'

test('simple parameter', () => {
  const param = convertStringToParam('0, GT, 42')
  const encodedParam = encodeParam(param)

  expect(param.id).toBe('0')
  expect(param.op).toBe(Op.GT)
  expect(param.value).toBe('42')

  expect(encodedParam).toBe(
    '5300541194335152988749892502228755547482451690626856874364818603877859370'
  )
})

test('lowercase operator, spaces variations', () => {
  const param = convertStringToParam('1,lt,  5')
  const encodedParam = encodeParam(param)

  expect(param.id).toBe('1')
  expect(param.op).toBe(Op.LT)
  expect(param.value).toBe('5')

  expect(encodedParam).toBe(
    '459380236842379925691657350193158814115145813187660929111617612336081141765'
  )
})

test('hex value', () => {
  const param = convertStringToParam(
    '2, EQ, 0xC7f8dDbc7B3BFd432dEAc0CA270110467EcE01c3'
  )
  const encodedParam = encodeParam(param)

  expect(param.id).toBe('2')
  expect(param.op).toBe(Op.EQ)
  expect(param.value).toBe('0xC7f8dDbc7B3BFd432dEAc0CA270110467EcE01c3')

  expect(encodedParam).toBe(
    '906392544231311161076231619022756262774761324877954494358762516206068826563'
  )
})

test('logic operator with 2 values', () => {
  const param = convertStringToParam('LOGIC_OP_PARAM_ID, OR, (1,2)')
  const encodedParam = encodeParam(param)

  expect(param.id).toBe('204')
  expect(encodedParam).toBe(
    '92289489581634127071453961653805605755732793869401080658523978318327291314177'
  )
})

test('logic operator with 3 values', () => {
  const param = convertStringToParam('LOGIC_OP_PARAM_ID, IF_ELSE, (1,2,3)')
  const encodedParam = encodeParam(param)

  expect(encodedParam).toBe(
    '92293023275763683840113128248807091592764448837194831896495561762951005208577'
  )
})
