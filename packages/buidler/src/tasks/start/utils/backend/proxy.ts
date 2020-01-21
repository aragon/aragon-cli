import { getMainContractName } from '../arapp'
import { KernelInstance } from '~/typechain'
import { logBack } from '../logger'
import Web3 from 'web3'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'

interface InitializableApp extends Truffle.ContractInstance {
  initialize: () => void
}

const BASE_NAMESPACE =
  '0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f'

/**
 * Creates a new app proxy using a Dao, and set's the specified implementation.
 * @returns Promise<Truffle.Contract<any>> The TruffleContract instance of the
 * deployed app contract, wrapped around an upgradeably proxy address.
 */
export async function createProxy(
  implementation: Truffle.ContractInstance,
  appId: string,
  dao: KernelInstance,
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts
): Promise<Truffle.ContractInstance> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Create a new app proxy with base implementation.
  const txResponse: Truffle.TransactionResponse = await dao.newAppInstance(
    appId,
    implementation.address,
    '0x',
    false,
    { from: rootAccount }
  )

  // Retrieve proxy address and wrap around abi.
  const mainContractName: string = getMainContractName()
  const App: Truffle.Contract<any> = artifacts.require(mainContractName)
  const logs: Truffle.TransactionLog[] = txResponse.logs
  const log: Truffle.TransactionLog | undefined = logs.find(
    l => l.event === 'NewAppProxy'
  )
  if (!log) {
    throw new Error(
      'Cannot find proxy address. Unable to find NewAppProxy log.'
    )
  }
  const proxyAddress: string = (log as Truffle.TransactionLog).args.proxy
  const proxy: InitializableApp = await App.at(proxyAddress)

  // Initialize the app.
  await proxy.initialize()

  return proxy
}

/**
 * Updates the app proxy's implementation in the Kernel.
 */
export async function updateProxy(
  implementation: Truffle.ContractInstance,
  appId: string,
  dao: KernelInstance,
  web3: Web3
): Promise<void> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  logBack(`Updating proxy implementation to: ${implementation.address}`)

  // Set the new implementation in the Kernel.
  await dao.setApp(BASE_NAMESPACE, appId, implementation.address, {
    from: rootAccount
  })
}
