import { getMainContractName } from '../arapp';

/**
 * Deploys the app's current contract.
 * @returns Promise<Truffle.Contract<any>> The deployed TruffleContract instance
 * for the app's main contract.
 */
export async function deployImplementation(): Promise<Truffle.Contract<any>> {
  const mainContractName: string = getMainContractName();

  // Deploy the main contract.
  const App: Truffle.Contract<any> = artifacts.require(mainContractName);
  const implementation: Truffle.Contract<any> = await App.new();

  return implementation;
}
