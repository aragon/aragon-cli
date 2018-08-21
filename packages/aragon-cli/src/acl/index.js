module.exports = (web3) => {
  const getACL = async (repoAddr) => {
    const repo = new web3.eth.Contract(require('@aragon/os/build/contracts/AragonApp').abi, repoAddr)
    const daoAddr = await repo.methods.kernel().call()
    const dao = new web3.eth.Contract(require('@aragon/os/build/contracts/Kernel').abi, daoAddr)
    const aclAddr = await dao.methods.acl().call()

    return new web3.eth.Contract(require('@aragon/os/build/contracts/ACL').abi, aclAddr)
  }

  const getRoleId = async (repoAddr) => {
    const repo = new web3.eth.Contract(require('@aragon/os/build/contracts/Repo').abi, repoAddr)
    return await repo.methods.CREATE_VERSION_ROLE().call()
  }

  return {
    grant: async (repoAddr, grantee) => {
      const acl = await getACL(repoAddr)

      const roleId = await getRoleId(repoAddr)

      const call = acl.methods.grantPermission(grantee, repoAddr, roleId)
      return {
        to: acl.options.address,
        data: call.encodeABI(),
        gas: web3.utils.toHex(5e5),
        gasPrice: web3.utils.toHex(web3.utils.toWei('15', 'gwei'))
      }
    }
  }
}
