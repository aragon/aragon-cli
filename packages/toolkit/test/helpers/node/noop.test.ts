import test from 'ava'
import { noop } from '../../../src'

test('noop() returns undefined', t => {
  t.is(noop(), undefined)
})

test('types are working', t => {
  interface Person {
    name: string
    lastName: string
  }
  const person: Person = { name: 'Joe', lastName: 'Doe' }
  t.is(person.name, 'Joe')
})
