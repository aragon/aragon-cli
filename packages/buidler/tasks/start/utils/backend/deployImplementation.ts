import { getMainContractName } from './getMainContract';

/**
 * Deploys the app's current contract
 * @return App TruffleContract
 */
async function deployImplementation(): Promise<Truffle.Contract<any>> {
  const mainContractName: string = getMainContractName();

  // Deploy the main contract.
  const App: Truffle.Contract<any> = artifacts.require(mainContractName);
  const implementation: Truffle.Contract<any> = await App.new();

  return implementation;
}

export default deployImplementation;
