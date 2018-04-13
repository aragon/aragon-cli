module.exports = (web3) => {
  const getACL = async (repoAddr) => {
    const repo = new web3.eth.Contract(require('@aragon/os/build/contracts/AragonApp'), repoAddr)
    const daoAddr = await repo.methods.kernel().call()
    const dao = new web3.eth.Contract(require('@aragon/os/build/contracts/Kernel'), daoAddr)
    const aclAddr = await dao.methods.acl().call()

    return new web3.eth.Contract(require('@aragon/os/build/contracts/ACL'), aclAddr)
  }

  return {
    grant: async (repoAddr, grantee) => {
      const acl = await getACL(repoAddr)

      const roleId = '0x0000000000000000000000000000000000000000000000000000000000000001'

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
