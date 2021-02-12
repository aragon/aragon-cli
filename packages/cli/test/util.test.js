import { convertDAOIdToSubdomain } from '@aragon/toolkit'
import { parseArgumentStringIfPossible } from '../src/util'

// jest
describe("utils tests", () => {

  test('parseArgumentStringIfPossible should parse a boolean string', () => {
    expect(parseArgumentStringIfPossible('true')).toEqual(true)
    expect(parseArgumentStringIfPossible('True')).toEqual(true)
    expect(parseArgumentStringIfPossible('TRUE')).toEqual(true)
    expect(parseArgumentStringIfPossible('false')).toEqual(false)
    expect(parseArgumentStringIfPossible('False')).toEqual(false)
  })
  
  test('parseArgumentStringIfPossible should parse an array as string', () => {
    expect(parseArgumentStringIfPossible('["test"]')).toStrictEqual(['test'])
    expect(parseArgumentStringIfPossible('[1, 2, "3"]')).toStrictEqual([1, 2, '3'])
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
    expect(() => convertDAOIdToSubdomain(daoId)).toThrow()
  })

})
