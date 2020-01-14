import { getMainContractName } from './getMainContract';

import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts';

/**
 * Deploys the app's current contract
 * @return App TruffleContract
 */
async function deployImplementation(artifacts: TruffleEnvironmentArtifacts): Promise<Truffle.Contract<any>> {
  const mainContractName: string = getMainContractName();

  const App: Truffle.Contract<any> = artifacts.require(mainContractName);
  const implementation: Truffle.Contract<any> = await App.new();

  return implementation;
}

export default deployImplementation;
