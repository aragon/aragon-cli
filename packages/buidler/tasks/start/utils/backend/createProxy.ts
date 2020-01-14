import { getMainContractName } from './getMainContract';

import {
  KernelInstance
} from '../../../../typechain';

interface InitializableApp extends Truffle.Contract<any> {
  initialize: () => void;
}

/**
 * Creates a new app proxy
 * @return proxy App TruffleContract
 */
async function createProxy(
  implementation: Truffle.Contract<any>,
  appId: string,
  dao: KernelInstance,
): Promise<Truffle.Contract<any>> {
  const rootAccount: string = (await web3.eth.getAccounts())[0];

  // Create a new app proxy with base implementation.
  const txResponse: Truffle.TransactionResponse = await dao.newAppInstance(
    appId,
    implementation.address,
    '0x',
    false,
    { from: rootAccount }
  );

  // Retrieve proxy address and wrap around abi.
  const mainContractName: string = getMainContractName();
  const App: Truffle.Contract<any> = artifacts.require(mainContractName);
  const logs: Truffle.TransactionLog[] = txResponse.logs;
  const log: Truffle.TransactionLog | undefined = logs.find(l => l.event === 'NewAppProxy');
  if (!log) {
    throw new Error('Cannot find proxy address. Unable to find NewAppProxy log.');
  }
  const proxyAddress: string = (<Truffle.TransactionLog>log).args.proxy;
  const proxy: InitializableApp = await App.at(proxyAddress);

  // Initialize the app.
  await proxy.initialize();

  return proxy;
}

export default createProxy;
