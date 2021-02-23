import { convertDAOIdToSubdomain } from '@aragon/toolkit'
import { parseArgumentStringIfPossible } from '../src/util'

test('parseArgumentStringIfPossible should parse a boolean string', () => {
  expect(parseArgumentStringIfPossible('true')).toBe(true)
  expect(parseArgumentStringIfPossible('True')).toBe(true)
  expect(parseArgumentStringIfPossible('TRUE')).toBe(true)
  expect(parseArgumentStringIfPossible('false')).toBe(false)
  expect(parseArgumentStringIfPossible('False')).toBe(false)
})

test('parseArgumentStringIfPossible should parse an array as string', () => {
  expect(parseArgumentStringIfPossible('["test"]')).toStrictEqual(['test'])
  expect(parseArgumentStringIfPossible('[1, 2, "3"]')).toStrictEqual([
    1,
    2,
    '3',
  ])
  expect(parseArgumentStringIfPossible('["hello", 1, "true"]')).toStrictEqual([
    'hello',
    1,
    'true',
  ])
})

test('convertDAOIdToSubdomain returns the correct format', () => {
  const daoId = 'dao1'
  expect(convertDAOIdToSubdomain(daoId)).toEqual(`${daoId}.aragonid.eth`)
})

test('convertDAOIdToSubdomain returns the same value when called with a subdomain', () => {
  const daoId = 'daotest2.aragonid.eth'
  expect(convertDAOIdToSubdomain(daoId)).toEqual(daoId)
})

test('convertDAOIdToSubdomain throws when called with an invalid DAO id', () => {
  const daoId = 'my dao'
  try {
    convertDAOIdToSubdomain(daoId)
    fail('it should not reach here')
  } catch (error) {}
})
