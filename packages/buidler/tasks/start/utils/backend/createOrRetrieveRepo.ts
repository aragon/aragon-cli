import ENS from 'ethjs-ens';

import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts';
import { provider } from 'web3-core';

import {
  RepoContract, RepoInstance,
  APMRegistryContract, APMRegistryInstance
} from '../../../../typechain';

const ENS_REGISTRY_ADDRESS: string = '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1';
const APM_REGISTRY_ADDRESS: string = '0x32296d9f8fed89658668875dc73cacf87e8888b2';

async function createOrRetrieveRepo(
  web3: Web3,
  appName: string,
  appId: string,
  rootAccount: string,
  artifacts: TruffleEnvironmentArtifacts
): Promise<RepoInstance> {
  // Retrieve the Repo address from ens, or create the Repo if nothing is retrieved.
  let repoAddress: string | null = await ensResolve(web3, appId).catch(() => null);
  if (!repoAddress) {
    repoAddress = await createRepo(appName, rootAccount, artifacts);
  }

  // Wrap Repo address with abi.
  const Repo: RepoContract = artifacts.require('Repo');
  const repo: RepoInstance = await Repo.at(repoAddress);

  return repo;
}

async function createRepo(
  appName: string,
  rootAccount: string,
  artifacts: TruffleEnvironmentArtifacts
):Promise<string> {
  // Retrieve APMRegistry.
  const APMRegistry: APMRegistryContract = artifacts.require('APMRegistry');
  const apmRegistry: APMRegistryInstance = await APMRegistry.at(APM_REGISTRY_ADDRESS);

  // Create new repo.
  const txResponse: Truffle.TransactionResponse = await apmRegistry.newRepo(appName, rootAccount);

  // Retrieve repo address from creation tx logs.
  const logs: Truffle.TransactionLog[] = txResponse.logs;
  const log: Truffle.TransactionLog | undefined = logs.find(l => l.event === 'NewRepo');
  if (!log) {
    throw new Error('Error creating Repo. Unable to find NewRepo log.');
  }
  const repoAddress = (<Truffle.TransactionLog>log).args.repo;

  return repoAddress;
}

async function ensResolve(
  web3: Web3,
  appId: string
): Promise<string> {
  // Define options used by ENS.
  const opts: {
    provider: provider,
    registryAddress: string
  } = {
    provider: web3.currentProvider,
    registryAddress: ENS_REGISTRY_ADDRESS
  };

  // Avoids a bug on ENS.
  if (!opts.provider.sendAsync) {
    opts.provider.sendAsync = opts.provider.send
  }

  // Set up ENS and resolve address.
  const ens: ENS = new ENS(opts);
  const address: string | null = await ens.resolveAddressForNode(appId);

  if (!address) {
    throw new Error('Unable to resolve ENS addres.')
  }

  return <string>address;
}

export default createOrRetrieveRepo;
