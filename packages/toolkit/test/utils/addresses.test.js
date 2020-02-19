import test from 'ava'
//
import { isAddress } from '../../src/utils/addresses'

test('isAddress returns the correct value', t => {
  t.true(isAddress('0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'))
  t.false(isAddress('INVALID'))
})
