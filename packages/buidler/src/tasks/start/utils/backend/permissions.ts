import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import { KernelInstance, ACLInstance } from '~/typechain';

export const ANY_ADDRESS: string = '0xffffffffffffffffffffffffffffffffffffffff';

/**
 * Scans arapp.json, setting all permissions to ANY_ADDRESS.
 */
export async function setAllPermissionsOpenly(
  dao: KernelInstance,
  app: any, // TODO: needs type
): Promise<void> {
  const rootAccount: string = (await web3.eth.getAccounts())[0];

  // Retrieve ACL.
  const aclAddress = await dao.acl();
  const ACL = artifacts.require('ACL');
  const acl = await ACL.at(aclAddress);

  // Set all permissions listed in arapp.json.
  // TODO: Must be set dynamically.
  await _setPermissionOpenly(acl, app, await app.INCREMENT_ROLE(), rootAccount);
  await _setPermissionOpenly(acl, app, await app.DECREMENT_ROLE(), rootAccount);
}

/**
 * Set's the specified permission to ANY_ADDRESS.
 */
async function _setPermissionOpenly(
  acl: ACLInstance,
  app: any, // TODO: needs type
  permission: string,
  rootAccount: string,
) {
  // Set permission to ANY_ADDRESS (max uint256), which is interpreted by
  // the ACL as giving such permission to all addresses.
  await acl.createPermission(
    ANY_ADDRESS,
    app.address,
    permission,
    rootAccount,
    { from: rootAccount },
  );
}
