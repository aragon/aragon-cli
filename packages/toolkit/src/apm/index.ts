import { ethers } from 'ethers'
import { Publish } from './publish'
import { Repo } from './repo'
import { Registry } from './registry'

export function Apm(
  provider: ethers.providers.Provider,
  options?: { ipfsGateway?: string }
) {
  return {
    ...Repo(provider, options),
    ...Publish(provider),
    ...Registry(provider),
  }
}
