/// <reference types="truffle-typings" />

import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts';

import {
  KernelContract, KernelInstance,
  ACLContract, ACLInstance,
  DAOFactoryContract, DAOFactoryInstance,
  EVMScriptRegistryFactoryContract, EVMScriptRegistryFactoryInstance
} from '../../../../typechain';

/**
 * Deploys a new DAO
 * @return DAO's Kernel TruffleContract
 */
async function createDao(rootAddress: string, artifacts: TruffleEnvironmentArtifacts): Promise<KernelInstance> {
  // Retrieve contract artifacts.
  const Kernel: KernelContract = artifacts.require('Kernel');
  const ACL: ACLContract = artifacts.require('ACL');
  const DAOFactory: DAOFactoryContract = artifacts.require('DAOFactory');
  const EVMScriptRegistryFactory: EVMScriptRegistryFactoryContract = artifacts.require('EVMScriptRegistryFactory');

  // Deploy a DAOFactory.
  const kernelBase: KernelInstance = await Kernel.new(true /*petrifyImmediately*/);
  const aclBase: ACLInstance = await ACL.new();
  const registryFactory: EVMScriptRegistryFactoryInstance = await EVMScriptRegistryFactory.new();
  const daoFactory: DAOFactoryInstance = await DAOFactory.new(
    kernelBase.address,
    aclBase.address,
    registryFactory.address
  );

  // Create a DAO instance using the factory.
  const txResponse: Truffle.TransactionResponse = await daoFactory.newDAO(rootAddress);

  // Find the created DAO instance address from the transaction logs.
  const logs: Truffle.TransactionLog[] = txResponse.logs;
  const log: Truffle.TransactionLog | undefined = logs.find(l => l.event === 'DeployDAO');
  if (!log) {
    throw new Error('Error deploying new DAO. Unable to find DeployDAO log.');
  }
  const daoAddress: string = log.args.dao;

  // Use the DAO address to construct a full KernelInstance object.
  const dao: KernelInstance = await Kernel.at(daoAddress);

  // Give rootAddress the ability to manage apps.
  const aclAddress: string = await dao.acl();
  const acl: ACLInstance = await ACL.at(aclAddress);
  await acl.createPermission(
    rootAddress,
    dao.address,
    await dao.APP_MANAGER_ROLE(),
    rootAddress,
    { from: rootAddress }
  );

  return dao;
}

export default createDao;
