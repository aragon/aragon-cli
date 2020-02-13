import test from 'ava'
//
import { isAddress, convertDAOIdToSubdomain, getIpfsCacheFiles, getAragonGanacheFiles, expandLink } from '../src/util'


test('isAddress returns the correct value', t => {
  t.true(isAddress('0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'))
  t.false(isAddress('INVALID'))
})

test('convertDAOIdToSubdomain returns the correct value', t => {
  t.is(convertDAOIdToSubdomain('test.aragonid.eth'), 'test.aragonid.eth')
  t.is(convertDAOIdToSubdomain('test'), 'test.aragonid.eth')
})

test('convertDAOIdToSubdomain throws on invalid input', t => {
  t.throws(() => convertDAOIdToSubdomain('test test'))
})

test('getIpfsCacheFiles returns the correct path', t => {
  t.true(getIpfsCacheFiles().includes('ipfs-cache'))
})

test('getAragonGanacheFiles returns the correct path', t => {
  t.true(getAragonGanacheFiles().includes('aragon-ganache'))
})

test('expandLink returns the correct values', t => {
  const link = expandLink({
    name: 'test', 
    address: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  })

  t.is(link.name, 'test')
  t.is(link.address, '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7')
  t.is(link.placeholder, '__test__________________________________')
  t.is(link.addressBytes, 'b4124cEB3451635DAcedd11767f004d8a28c6eE7')

})