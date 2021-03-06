import encodeActCall from '../../src/dao/encodeActCall'

test('Returns the correct encoded call with no params', () => {
  expect(encodeActCall('myMethod()')).toBe('0x70dce926')
})

test('Returns the correct encoded call with params', () => {
  expect(
    encodeActCall('myMethod(address)', [
      '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
    ])
  ).toBe(
    '0x973bd4060000000000000000000000008401eb5ff34cc943f096a32ef3d5113febe8d4eb'
  )

  expect(encodeActCall('myMethod(uint256,bool)', ['2', true])).toBe(
    '0xe1ca9f2300000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001'
  )

  expect(encodeActCall('myMethod(uint256,string)', ['1', 'test'])).toBe(
    '0x24ee00970000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000047465737400000000000000000000000000000000000000000000000000000000'
  )
})

test('Throws with wrong number of params', () => {
  try {
    encodeActCall('myMethod(bool,string)', [true])
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {}
})
