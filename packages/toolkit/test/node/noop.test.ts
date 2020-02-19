import test from 'ava'
import { noop } from '../../src'

test('noop() returns undefined', t => {
  /* eslint-disable-next-line @typescript-eslint/no-inferrable-types */
  const undefinedVar: undefined = undefined
  t.is(noop(), undefinedVar)
})

test('types are working', t => {
  interface Person {
    name: string
    lastName: string
  }
  const person: Person = { name: 'Joe', lastName: 'Doe' }
  t.is(person.name, 'Joe')
})
