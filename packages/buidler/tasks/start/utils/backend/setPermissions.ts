const ANY_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff';

async function setPermissions(dao, app, root, artifacts) {
  // Retrieve ACL.
  const aclAddress = await dao.acl();
  const ACL = artifacts.require('ACL');
  const acl = await ACL.at(aclAddress);

  // TODO: Must be set dynamically.
  await setPermission(acl, app, await app.INCREMENT_ROLE(), root);
  await setPermission(acl, app, await app.DECREMENT_ROLE(), root);
}

async function setPermission(acl, app, permission, root) {
  console.log(`Setting permission: ${permission}`)

  await acl.createPermission(
    ANY_ADDRESS,
    app.address,
    permission,
    root,
    { from: root }
  )
}

export default setPermissions;
