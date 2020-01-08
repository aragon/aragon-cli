/**
 * Deploys a new DAO
 * @return DAO's Kernel TruffleContract
 */
async function createDao(root, artifacts) {
  // Create Kernel instance.
  const Kernel = artifacts.require('Kernel');
  const dao = await Kernel.new(false);

  // Initialize Kernel instance.
  const ACL = artifacts.require('ACL');
  const aclBase = await ACL.new();
  await dao.initialize(aclBase.address, root);

  // Give first account the ability to manage apps.
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
