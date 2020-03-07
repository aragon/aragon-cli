import { ethers } from 'ethers'

export function getAragenProvider() {
  return new ethers.providers.JsonRpcProvider('http://localhost:8545', {
    name: 'aragen',
    chainId: 36956973,
    ensAddress: '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1',
  })
}
