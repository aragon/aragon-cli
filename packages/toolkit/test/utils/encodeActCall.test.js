import test from 'ava'
//
import { encodeActCall } from '../../src/utils/encodeActCall'

test('Returns the correct encoded call with no params', t => {
  t.is(encodeActCall('myMethod()'), '0x70dce926')
})

test('Returns the correct encoded call with params', t => {
  t.is(
    encodeActCall('myMethod(address)', [
      '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
    ]),
    '0x973bd4060000000000000000000000008401eb5ff34cc943f096a32ef3d5113febe8d4eb'
  )

  t.is(
    encodeActCall('myMethod(uint256,bool)', ['2', true]),
    '0xe1ca9f2300000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001'
  )

  t.is(
    encodeActCall('myMethod(uint256,string)', ['1', 'test']),
    '0x24ee00970000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000047465737400000000000000000000000000000000000000000000000000000000'
  )
})

test('Throws with wrong number of params', t => {
  t.throws(() => encodeActCall('myMethod(bool,string)', [true]))
})
