import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { KernelInstance, ACLInstance } from '~/typechain'
import { AragonAppJson } from '~/src/types'

export const ANY_ADDRESS: string = '0xffffffffffffffffffffffffffffffffffffffff'

/**
 * Scans arapp.json, setting all permissions to ANY_ADDRESS.
 */
export async function setAllPermissionsOpenly(
  dao: KernelInstance,
  app: any, // TODO: needs type
  arapp: AragonAppJson
): Promise<void> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Retrieve ACL.
  const aclAddress = await dao.acl()
  const ACL = artifacts.require('ACL')
  const acl = await ACL.at(aclAddress)

  for (const role of arapp.roles) {
    const permission = await app[role.id]()
    // Set permission to ANY_ADDRESS (max uint256), which is interpreted by
    // the ACL as giving such permission to all addresses.
    await acl.createPermission(
      ANY_ADDRESS,
      app.address,
      permission,
      rootAccount,
      { from: rootAccount }
    )
  }
}
