import { getMainContractName } from './getMainContract';

/**
 * Creates a new app proxy
 * @return proxy App TruffleContract
 */
async function createProxy(implementation, appId, root, dao, artifacts) {
  // Create a new app proxy with base implementation.
  const { logs } = await dao.newAppInstance(
    appId,
    implementation.address,
    '0x',
    false,
    { from: root }
  );

  // Retrieve proxy address and wrap around abi.
  const mainContractName = getMainContractName();
  const App = artifacts.require(mainContractName);
  const proxy = App.at(logs.find(l => l.event === 'NewAppProxy').args.proxy);

  return proxy;
}

export default createProxy;
