import test from 'ava'
import { noop } from '../../src'

test('noop() returns undefined', t => {
  /* eslint-disable-next-line @typescript-eslint/no-inferrable-types */
  const undefinedVar: undefined = undefined
  t.is(noop(), undefinedVar)
})
