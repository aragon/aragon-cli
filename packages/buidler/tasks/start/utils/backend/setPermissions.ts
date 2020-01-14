import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts';

import {
  KernelInstance,
  ACLInstance
} from '../../../../typechain';

const ANY_ADDRESS: string = '0xffffffffffffffffffffffffffffffffffffffff';

async function setPermissions(
  dao: KernelInstance,
  app: any, // TODO: needs type
  rootAccount: string,
  artifacts: TruffleEnvironmentArtifacts
): Promise<void> {
  // Retrieve ACL.
  const aclAddress = await dao.acl();
  const ACL = artifacts.require('ACL');
  const acl = await ACL.at(aclAddress);

  // Set all permissions listed in arapp.json.
  // TODO: Must be set dynamically.
  await setOpenPermission(acl, app, await app.INCREMENT_ROLE(), rootAccount);
  await setOpenPermission(acl, app, await app.DECREMENT_ROLE(), rootAccount);
}

async function setOpenPermission(
  acl: ACLInstance,
  app: Truffle.Contract<any>,
  permission: string,
  rootAccount: string
) {
  console.log(`Setting permission: ${permission}`)

  // Set permission to ANY_ADDRESS (max uint256), which is interpreted by
  // the ACL as giving such permission to all addresses.
  await acl.createPermission(
    ANY_ADDRESS,
    app.address,
    permission,
    rootAccount,
    { from: rootAccount }
  );
}

export default setPermissions;
