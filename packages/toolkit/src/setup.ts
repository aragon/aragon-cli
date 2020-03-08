import { ethers } from 'ethers'
import validUrl from 'valid-url'
import { AsyncSendable } from 'ethers/providers'

export const aragonRpcMainnet = 'https://mainnet.eth.aragon.network'
export const aragonRpcRopsten = 'https://ropsten.eth.aragon.network'
export const aragonRpcRinkeby = 'https://rinkeby.eth.aragon.network'
export const aragonRpcKovan = 'https://kovan.eth.aragon.network'
export const aragenRpc = 'http://localhost:8545'
export const aragenEnsAddress = '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'

export type ProviderArgument =
  | AragonNetworkTag
  | DefaultNetworkTag
  | 'aragen'
  | string
  | ethers.providers.Provider
  | AsyncSendable

export interface ProviderOptions {
  ipfsGateway?: string
  ensAddress?: string
  infuraProjectId?: string
  etherscanApiToken?: string
  // Options for JsonRpc providers
  headers?: { [key: string]: string | number }
  timeout?: number
}

type DefaultNetworkTag =
  | 'homestead'
  | 'rinkeby'
  | 'ropsten'
  | 'kovan'
  | 'goerli'
const defaultNetworkTags: DefaultNetworkTag[] = [
  'homestead',
  'rinkeby',
  'ropsten',
  'kovan',
  'goerli',
]

type AragonNetworkTag =
  | 'aragon:mainnet'
  | 'aragon:ropsten'
  | 'aragon:rinkeby'
  | 'aragon:kovan'
const aragonNetworkTags: AragonNetworkTag[] = [
  'aragon:mainnet',
  'aragon:ropsten',
  'aragon:rinkeby',
  'aragon:kovan',
]

/**
 * Returns an initialized ethers provider given a flexible options
 *
 * @param providerArg Provider argument
 * - Aragon network name {AragonNetworkTag}
 *   'aragon:mainnet', 'aragon:ropsten', 'aragon:rinkeby', 'aragon:kovan'
 *   Connects to Aragon's public nodes
 * - Default network name {DefaultNetworkTag}
 *   'homestead', 'rinkeby', 'ropsten', 'kovan', 'goerli'
 *   Connects to a public RPC endpoint (Infura, Etherscan)
 *   If no token is provided the default ethers token is used.
 *   You can provide your Infura project ID with the option `infuraProjectId`
 *   or your own Etherscan api token with the option `etherscanApiToken`
 * - 'aragen'
 *   Connect to a local testnet with Aragon's aragen settings
 * - JSON RPC URL endpoint {string}
 *   Connects to the given valid URL
 * - ethers provider {ethers.providers.Provider}
 *   Already initialized ethers instance
 * - web3 provider {AsyncSendable}
 *   Web3.js provider. Must have the sendAsync method
 *
 * @param options Additional options
 * - ipfsGateway: IPFS gateway to retrieve content if necessary
 * - ensAddress: Custom ENS address for private networks
 * - infuraProjectId: Infura project ID to prevent using the default one
 * - etherscanApiToken?: Etherscan api token to prevent using the default one
 * - headers: Custom headers for JSON RPC providers
 * - timeout: Custom timeout for JSON RPC providers
 */
export function parseProviderArgument(
  providerArg: ProviderArgument,
  options?: ProviderOptions
): ethers.providers.Provider {
  const { ensAddress, headers, timeout, infuraProjectId, etherscanApiToken } =
    options || {}

  /**
   * Ethers network options allow to provide a custom ensAddress
   * Most ethers providers accept it so it's defined in the top scope
   */
  const networkOptions = ensAddress
    ? { name: 'custom', chainId: 999, ensAddress }
    : undefined

  function getProviderFromUrl(url: string): ethers.providers.Provider {
    const connectionInfo = headers ? { url, headers, timeout } : url
    return new ethers.providers.JsonRpcProvider(connectionInfo, networkOptions)
  }

  function getAragenProvider() {
    return new ethers.providers.JsonRpcProvider(aragenRpc, {
      name: 'aragen',
      chainId: 999999,
      ensAddress: ensAddress || aragenEnsAddress,
    })
  }

  // Default provider for empty strings or undefined
  if (!providerArg) {
    return getAragenProvider()
  }

  // Provider is a string
  if (typeof providerArg === 'string') {
    // Aragon network tags
    if (aragonNetworkTags.includes(providerArg as AragonNetworkTag))
      switch (providerArg as AragonNetworkTag) {
        case 'aragon:mainnet':
          return getProviderFromUrl(aragonRpcMainnet)
        case 'aragon:ropsten':
          return getProviderFromUrl(aragonRpcRopsten)
        case 'aragon:rinkeby':
          return getProviderFromUrl(aragonRpcRinkeby)
        case 'aragon:kovan':
          return getProviderFromUrl(aragonRpcKovan)
        default:
          throw Error(`Aragon network not supported: ${providerArg}`)
      }

    // Default ethers provider tags
    // Note: ethers provides a default API Token shared by all users of the library
    // Note: ethers.getDefaultProvider does not accept any other options
    if (defaultNetworkTags.includes(providerArg as DefaultNetworkTag)) {
      if (infuraProjectId) {
        return new ethers.providers.InfuraProvider(providerArg, infuraProjectId)
      } else if (etherscanApiToken) {
        return new ethers.providers.EtherscanProvider(
          providerArg,
          etherscanApiToken
        )
      } else {
        return ethers.getDefaultProvider(providerArg)
      }
    }

    // Aragen testing network
    // Note: expects a specific testnet with pre-deployed contracts
    if (providerArg === 'aragen') {
      return getAragenProvider()
    }

    if (validUrl.isWebUri(providerArg)) {
      return getProviderFromUrl(providerArg)
    }

    throw Error(`provider is not a valid URL: ${providerArg}`)
  }

  // Provider is already an ethers provider
  if (providerArg instanceof ethers.providers.Provider) {
    return providerArg
  }

  // Provider is a web3 provider, for example from `web3.currentProvider`
  // Note: it expects the provider to gave the method send or sendAsync
  if (
    typeof providerArg === 'object' &&
    (typeof providerArg.sendAsync === 'function' ||
      typeof providerArg.send === 'function')
  ) {
    return new ethers.providers.Web3Provider(providerArg, networkOptions)
  }

  // No previous block was match
  throw Error(`Unsupported provider argument`)
}
