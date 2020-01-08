import { getMainContractName } from './getMainContract';

/**
 * Deploys the app's current contract
 * @return App TruffleContract
 */
async function deployImplementation(artifacts) {
  const mainContractName = getMainContractName();

  const App = artifacts.require(mainContractName);
  const implementation = await App.new();

  return implementation;
}

export default deployImplementation;
