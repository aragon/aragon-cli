const { keccak256 } = require('js-sha3')

module.exports = (web3) => {
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

      return {
        to: repoAddr,
        data: acl.methods.grantPermission(grantee, repoAddr, keccak256('NEW_VERSION_ROLE')).encodeABI(),
        gas: web3.utils.toHex(1500000),
        gasPrice: web3.utils.toHex(web3.utils.toWei('3', 'gwei'))
      }
    }
  }
}
