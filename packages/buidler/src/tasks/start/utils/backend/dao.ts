import {
  KernelContract,
  KernelInstance,
  ACLContract,
  ACLInstance,
  DAOFactoryContract,
  DAOFactoryInstance,
  EVMScriptRegistryFactoryContract,
  EVMScriptRegistryFactoryInstance
} from '~/typechain'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import Web3 from 'web3'

/**
 * Deploys a new DAO with direct/pure interaction with aragonOS.
 * @returns DAO's Kernel TruffleContract.
 */
export async function createDao(
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts
): Promise<KernelInstance> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Retrieve contract artifacts.
  const Kernel: KernelContract = artifacts.require('Kernel')
  const ACL: ACLContract = artifacts.require('ACL')
  const DAOFactory: DAOFactoryContract = artifacts.require('DAOFactory')
  const EVMScriptRegistryFactory: EVMScriptRegistryFactoryContract = artifacts.require(
    'EVMScriptRegistryFactory'
  )

  // Deploy a DAOFactory.
  const kernelBase: KernelInstance = await Kernel.new(
    true /*petrifyImmediately*/
  )
  const aclBase: ACLInstance = await ACL.new()
  const registryFactory: EVMScriptRegistryFactoryInstance = await EVMScriptRegistryFactory.new()
  const daoFactory: DAOFactoryInstance = await DAOFactory.new(
    kernelBase.address,
    aclBase.address,
    registryFactory.address
  )

  // Create a DAO instance using the factory.
  const txResponse: Truffle.TransactionResponse = await daoFactory.newDAO(
    rootAccount
  )

  // Find the created DAO instance address from the transaction logs.
  const logs: Truffle.TransactionLog[] = txResponse.logs
  const log: Truffle.TransactionLog | undefined = logs.find(
    l => l.event === 'DeployDAO'
  )
  if (!log) {
    throw new Error('Error deploying new DAO. Unable to find DeployDAO log.')
  }
  const daoAddress: string = (log as Truffle.TransactionLog).args.dao

  // Use the DAO address to construct a full KernelInstance object.
  const dao: KernelInstance = await Kernel.at(daoAddress)

  // Give rootAccount the ability to manage apps.
  const aclAddress: string = await dao.acl()
  const acl: ACLInstance = await ACL.at(aclAddress)
  await acl.createPermission(
    rootAccount,
    dao.address,
    await dao.APP_MANAGER_ROLE(),
    rootAccount,
    { from: rootAccount }
  )

  return dao
}
