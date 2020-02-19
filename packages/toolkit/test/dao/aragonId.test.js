import test from 'ava'
//
import { convertDAOIdToSubdomain } from '../../src/utils/aragonId'

test('convertDAOIdToSubdomain returns the correct value', t => {
  t.is(convertDAOIdToSubdomain('test.aragonid.eth'), 'test.aragonid.eth')
  t.is(convertDAOIdToSubdomain('test'), 'test.aragonid.eth')
})

test('convertDAOIdToSubdomain throws on invalid input', t => {
  t.throws(() => convertDAOIdToSubdomain('test test'))
})
