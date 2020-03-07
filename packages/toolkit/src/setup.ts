import { ethers } from 'ethers'

export type ProviderArgument = ethers.providers.Provider | string
export interface ProviderOptions {
  ipfsGateway?: string
  ensAddress?: string
}

export function parseProviderArgument(
  providerArg: ProviderArgument,
  options?: ProviderOptions
): ethers.providers.Provider {
  if (providerArg instanceof ethers.providers.Provider) {
    return providerArg
  } else if (typeof providerArg === 'string') {
    return new ethers.providers.JsonRpcProvider(providerArg)
  } else {
    throw Error(`Unsupported provider argument`)
  }
}
