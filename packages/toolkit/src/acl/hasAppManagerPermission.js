const kernelAbi = require('@aragon/os/build/contracts/Kernel').abi
const aclAbi = require('@aragon/os/build/contracts/ACL').abi

/**
 * Return a task list for viewing DAO ACL permissions
 *
 * @param  {string} dao DAO address or ENS name
 * @param  {string} address user address
 * @param  {web3} web3 Web3
 * @return {boolean} Address has app manager permission
 */
export async function hasAppManagerPermission(daoAddr, address, web3) {
  const dao = new web3.eth.Contract(kernelAbi, daoAddr)
  const aclAddr = await dao.methods.acl().call()
  const acl = new web3.eth.Contract(aclAbi, aclAddr)

  const appManagerRoleId = await dao.methods.APP_MANAGER_ROLE().call()

  const hasPermission = await acl.methods
    .hasPermission(address, daoAddr, appManagerRoleId)
    .call()

  return hasPermission
}
