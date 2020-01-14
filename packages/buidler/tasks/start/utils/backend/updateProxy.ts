import {
  KernelInstance
} from '../../../../typechain';

const BASE_NAMESPACE: string = '0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f';

/**
 * Updates the app proxy's implementation in the Kernel
 */
async function updateProxy(
  implementation: Truffle.Contract<any>,
  appId: string,
  dao: KernelInstance
): Promise<void> {
  const rootAccount: string = (await web3.eth.getAccounts())[0];

  console.log(`Updating proxy implementation to: ${implementation.address}`);

  // Set the new implementation in the Kernel.
  await dao.setApp(BASE_NAMESPACE, appId, implementation.address, {
    from: rootAccount
  });
}

export default updateProxy;
