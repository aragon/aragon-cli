import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts';

import {
  KernelInstance,
  ACLInstance
} from '../../../../typechain';

const ANY_ADDRESS: string = '0xffffffffffffffffffffffffffffffffffffffff';

async function setPermissions(
  dao: KernelInstance,
  app: any, // TODO: needs type
  rootAddress: string,
  artifacts: TruffleEnvironmentArtifacts
): Promise<void> {
  // Retrieve ACL.
  const aclAddress = await dao.acl();
  const ACL = artifacts.require('ACL');
  const acl = await ACL.at(aclAddress);

  // Set all permissions listed in arapp.json.
  // TODO: Must be set dynamically.
  await setOpenPermission(acl, app, await app.INCREMENT_ROLE(), rootAddress);
  await setOpenPermission(acl, app, await app.DECREMENT_ROLE(), rootAddress);
}

async function setOpenPermission(
  acl: ACLInstance,
  app: Truffle.Contract<any>,
  permission: string,
  rootAddress: string
) {
  console.log(`Setting permission: ${permission}`)

  // Set permission to ANY_ADDRESS (max uint256), which is interpreted by
  // the ACL as giving such permission to all addresses.
  await acl.createPermission(
    ANY_ADDRESS,
    app.address,
    permission,
    rootAddress,
    { from: rootAddress }
  );
}

export default setPermissions;
