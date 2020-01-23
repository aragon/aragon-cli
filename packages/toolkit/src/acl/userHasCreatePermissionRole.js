const kernelAbi = require('@aragon/os/build/contracts/Kernel').abi
const aclAbi = require('@aragon/os/build/contracts/ACL').abi

export const userHasCreatePermissionRole = async (daoAddr, web3) => {
  const dao = new web3.eth.Contract(kernelAbi, daoAddr)
  const aclAddr = await dao.methods.acl().call()
  const acl = new web3.eth.Contract(aclAbi, aclAddr)

  const createPermissionsRoleId = await acl.methods
    .CREATE_PERMISSIONS_ROLE()
    .call()

  const accounts = await web3.eth.getAccounts()
  const userAddress = accounts[0]
  if (!userAddress) throw Error(`Error getting accounts from web3`)

  const hasPermission = await acl.methods.hasPermission(
    userAddress,
    aclAddr,
    createPermissionsRoleId
  )
  return hasPermission
}
