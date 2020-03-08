import test from 'ava'
import Web3 from 'web3'
import { ethers } from 'ethers'

import { parseProviderArgument, aragonRpcMainnet } from '../src/setup'
import { AsyncSendable } from 'ethers/providers'

interface EthersProviderInternal {
  connection: {
    url: string
  }
}

function getProviderUrl(provider: ethers.providers.Provider): string {
  // Must cast the type of the provider since this internal url property
  // is not explicitly stated in the actual providers type
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const _provider: EthersProviderInternal = provider as any
  return _provider.connection.url
}

test('Get a provider from a network tag', t => {
  const provider = parseProviderArgument('aragon:mainnet')
  t.is(getProviderUrl(provider), aragonRpcMainnet)
})

test('Get a provider from a web3 provider', t => {
  const web3 = new Web3(aragonRpcMainnet)
  const provider = parseProviderArgument(web3.currentProvider as AsyncSendable)
  t.is(getProviderUrl(provider), 'https://mainnet.eth.aragon.network')
})
