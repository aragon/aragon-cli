import { getMainContractName } from './getMainContract';
import deployImplementation from './deployImplementation';

/**
 * Creates a new app proxy
 * @return proxy App TruffleContract
 */
async function createProxy(appId, root, dao, artifacts) {
  // Deploy base implementation.
  const implementation = await deployImplementation(artifacts);
  // console.log(`  First implementation: ${implementation.address}`);

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
