/**
 * Deploys a new DAO
 * @return DAO's Kernel TruffleContract
 */
async function createDao(root, artifacts) {
  // Deploy a DAOFactory.
  const Kernel = artifacts.require('Kernel');
  const kernelBase = await Kernel.new(true /*petrifyImmediately*/);
  const ACL = artifacts.require('ACL');
  const aclBase = await ACL.new();
  const EVMScriptRegistryFactory = artifacts.require('EVMScriptRegistryFactory');
  const registryFactory = await EVMScriptRegistryFactory.new();
  const DAOFactory = artifacts.require('DAOFactory');
  const daoFactory = await DAOFactory.new(
    kernelBase.address,
    aclBase.address,
    registryFactory.address
  );

  // Create a DAO instance using the factory.
  const { logs } = await daoFactory.newDAO(root);
  const dao = await Kernel.at(logs.find(l => l.event === 'DeployDAO').args.dao);

  // Give root the ability to manage apps.
  const acl = await ACL.at(await dao.acl());
  await acl.createPermission(
    root,
    dao.address,
    await dao.APP_MANAGER_ROLE(),
    root,
    { from: root }
  );

  return dao;
}

export default createDao;
