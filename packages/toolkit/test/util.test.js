import test from 'ava'
//
import { getIpfsCacheFiles, getAragonGanacheFiles } from '../src/util'

test('getIpfsCacheFiles returns the correct path', t => {
  t.true(getIpfsCacheFiles().includes('ipfs-cache'))
})

test('getAragonGanacheFiles returns the correct path', t => {
  t.true(getAragonGanacheFiles().includes('aragon-ganache'))
})
