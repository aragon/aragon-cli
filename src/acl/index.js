

module.exports = (web3, apmRegistry) => {
  const getACL = async (repoAddr) => {
    const repo = new web3.eth.Contract(require('../../abi/apm/Repo'), repoAddr)
    const daoAddr = await repo.methods.kernel.call()
    const dao = new web3.eth.Contract(require('../../abi/aragonOS/Kernel'), daoAddr)
    const aclAddr = await dao.methods.acl.call()

    return new web3.eth.Contract(require('../../abi/aragonOS/ACL'), aclAddr)
  }

  return {
    grant: async (repoAddr, grantee) => {
      const acl = await getACL(repoAddr)
    }
  }
}
