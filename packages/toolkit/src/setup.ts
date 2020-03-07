import { ethers } from 'ethers'
import validUrl from 'valid-url'

export type ProviderArgument = ethers.providers.Provider | string
export interface ProviderOptions {
  ipfsGateway?: string
  ensAddress?: string
}

type NetworkTag = 'mainnet' | 'rinkeby' | 'localhost'
const networkTags = ['mainnet', 'rinkeby', 'localhost']

export function parseProviderArgument(
  providerArg: ProviderArgument,
  options?: ProviderOptions
): ethers.providers.Provider {
  // Provider is already an ethers provider
  if (providerArg instanceof ethers.providers.Provider) {
    return providerArg
  }

  // Provider is a string or undefined, parse
  if (!providerArg || typeof providerArg === 'string') {
    // Default provider for empty strings or undefined
    if (!providerArg)
      return new ethers.providers.JsonRpcProvider('http://localhost:8545')

    // Known network tags
    if (networkTags.includes(providerArg))
      switch (providerArg as NetworkTag) {
        case 'mainnet':
          throw Error('Network mainnet not supported yet')
        case 'rinkeby':
          throw Error('Network rinkeby not supported yet')
        case 'localhost':
          return new ethers.providers.JsonRpcProvider('http://localhost:8545')
      }

    if (validUrl.isWebUri(providerArg))
      return new ethers.providers.JsonRpcProvider(providerArg)
    else throw Error(`provider is not a valid URL: ${providerArg}`)
  }

  // No previous block was match
  throw Error(`Unsupported provider argument`)
}
