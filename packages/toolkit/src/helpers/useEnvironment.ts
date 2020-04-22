import Web3 from 'web3'
import url from 'url'
import { ethers } from 'ethers'
//
import { readAragonConfig } from '../utils/fsUtils'
import { defaultEnvironments } from '../config'
import {
  DEFAULT_GAS_PRICE,
  FRAME_ENDPOINT,
  FRAME_ORIGIN,
  ARAGON_RINKEBY_ENDPOINT,
  ARAGON_MAINNET_ENDPOINT,
  IPFS_RPC,
  IPFS_LOCAL_GATEWAY,
  IPFS_ARAGON_GATEWAY,
  DEVCHAIN_ENS,
} from './constants'
import { AragonEnvironment } from '../types'
import { WebsocketProvider } from 'web3-core'
import { isHexStrict } from 'web3-utils'

export class NoEnvironmentInDefaults extends Error {}
export class NoNetworkInTruffleConfig extends Error {}

function getEnvironment(envName: string): AragonEnvironment {
  if (!envName) envName = 'local'
  const environment = defaultEnvironments[envName]
  if (!environment) throw new NoEnvironmentInDefaults(envName)
  return environment
}

interface ApmOptions {
  ensRegistryAddress: string
  ipfs: {
    rpc: {
      protocol: string
      host: string
      port: number
      default?: boolean
    }
    gateway: string
  }
}

function configureApm(
  ipfsRpcUrl: string,
  gatewayUrl: string,
  ensRegistryAddress: string
): ApmOptions {
  if (ipfsRpcUrl) {
    const uri = new url.URL(ipfsRpcUrl)
    return {
      ensRegistryAddress,
      ipfs: {
        rpc: {
          protocol: uri.protocol.replace(':', ''),
          host: uri.hostname,
          port: parseInt(uri.port),
          default: uri.hash === '#default',
        },
        gateway: gatewayUrl,
      },
    }
  } else {
    return {
      ensRegistryAddress,
      ipfs: {
        rpc: {
          protocol: '',
          host: '',
          port: 0,
        },
        gateway: gatewayUrl,
      },
    }
  }
}

function configureProvider(
  network: string,
  useFrame: boolean,
  providerUrl?: string
): any | WebsocketProvider {
  if (useFrame) {
    return new Web3.providers.WebsocketProvider(
      FRAME_ENDPOINT,
      { headers: { origin: FRAME_ORIGIN } } // Provider options
    )
  }

  if (network === 'rpc') {
    return new Web3.providers.WebsocketProvider('http://localhost:8545')
  } else {
    return providerUrl
      ? new Web3.providers.WebsocketProvider(providerUrl)
      : undefined
  }
}

function configureEthersProvider({
  network,
  currentProvider,
  ensAddress,
}: {
  network: string
  ensAddress: string
  currentProvider: any | WebsocketProvider
}): ethers.providers.Provider {
  const networkOptions = ensAddress
    ? { name: network, chainId: 0, ensAddress }
    : undefined
  return new ethers.providers.Web3Provider(currentProvider, networkOptions)
}

interface GenericMnemonic {
  mnemonic: string
}
interface ByNetworkMnemonic {
  rpc?: string
  keys?: string[] // privateKeys = [ "3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580" ];
}

function setAccounts(web3: Web3, networkName: string) {
  // TODO: Add way to support keystore with decrypt of passwork

  // Standard Aragon key paths
  const genericName = 'mnemonic.json'
  const byNetworkName = (network: string): string => `${network}_key.json`

  /**
   * Utility to ensure and array of strings has hex encoding
   * @param keys ['34b...456', '0x456...3e2']
   */
  const ensureHexEncoding = (keys: string[]): string[] =>
    keys.map(key => (isHexStrict(key) ? key : `0x${key}`))

  const genericMnemonic = readAragonConfig<GenericMnemonic>(genericName)
  const byNetwork = readAragonConfig<ByNetworkMnemonic>(
    byNetworkName(networkName)
  )

  if (byNetwork && byNetwork.keys) {
    const keys = ensureHexEncoding(byNetwork.keys)
    keys.forEach(key => {
      const wallet = web3.eth.accounts.privateKeyToAccount(key)
      web3.eth.accounts.wallet.add(wallet)
    })
  } else if (genericMnemonic) {
    const wallet = ethers.Wallet.fromMnemonic(genericMnemonic.mnemonic)
    web3.eth.accounts.wallet.add(wallet)
  }
}

// TODO: Fetch api
// const configureGasPrice = () => {}

interface UseEnvironment extends AragonEnvironment {
  apmOptions: ApmOptions
  web3: Web3
  gasPrice: string
  provider: ethers.providers.Provider
}

let web3: Web3

export function useEnvironment(env: string): UseEnvironment {
  // TODO: Add config object

  // Parse environment
  const useFrame = RegExp(/frame:(.*)/).test(env)
  env = useFrame ? env.split(/:(.+)/)[1] || env : env

  const environment = getEnvironment(env)

  const { network, registry, gasPrice } = environment

  const providerUrl =
    network === 'rinkeby'
      ? ARAGON_RINKEBY_ENDPOINT
      : network === 'mainnet'
      ? ARAGON_MAINNET_ENDPOINT
      : undefined

  const ipfsAragonGateway =
    network === 'rpc' ? IPFS_LOCAL_GATEWAY : IPFS_ARAGON_GATEWAY

  const ensAddress = registry || DEVCHAIN_ENS

  if (!web3) {
    web3 = new Web3(configureProvider(network, useFrame, providerUrl))
    setAccounts(web3, network)
  }

  return {
    ...environment,
    apmOptions: configureApm(
      IPFS_RPC, // TODO: Check if we need to use Aragon node to publish (ipfs-rpc is An URI to the IPFS node used to publish files)
      ipfsAragonGateway,
      ensAddress
    ),
    // Todo: Consolidate provider initialization
    web3,
    provider: configureEthersProvider({
      network,
      currentProvider: web3.currentProvider,
      ensAddress,
    }),
    gasPrice: gasPrice || DEFAULT_GAS_PRICE,
  }
}
