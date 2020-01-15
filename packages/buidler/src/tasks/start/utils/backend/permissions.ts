import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import { KernelInstance, ACLInstance } from '~typechain';

const ANY_ADDRESS: string = '0xffffffffffffffffffffffffffffffffffffffff';

/**
 * Scans arapp.json, setting all permissions to ANY_ADDRESS.
 */
export async function setPermissions(
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
  await _setOpenPermission(acl, app, await app.INCREMENT_ROLE(), rootAccount);
  await _setOpenPermission(acl, app, await app.DECREMENT_ROLE(), rootAccount);
}

/**
 * Set's the specified permission to ANY_ADDRESS.
 */
async function _setOpenPermission(
  acl: ACLInstance,
  app: Truffle.Contract<any>,
  permission: string,
  rootAccount: string,
) {
  console.log(`Setting permission: ${permission}`);

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
