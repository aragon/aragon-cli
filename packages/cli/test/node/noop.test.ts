import test from 'ava'
import { noop } from '../../../src'

test('noop() returns undefined', t => {
  t.is(noop(), undefined)
})
