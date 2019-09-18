const { getRecommendedGasLimit } = require('@aragon/cli-utils')

module.exports = ({ web3, gasPrice, network }) => {
  const getACL = async repoAddr => {
    const repo = new web3.eth.Contract(
      require('../abi/os/AragonApp').abi,
      repoAddr
    )
    const daoAddr = await repo.methods.kernel().call()
    const dao = new web3.eth.Contract(require('../abi/os/Kernel').abi, daoAddr)
    const aclAddr = await dao.methods.acl().call()

    return new web3.eth.Contract(require('../abi/os/ACL').abi, aclAddr)
  }

  const getRoleId = async repoAddr => {
    const repo = new web3.eth.Contract(require('../abi/os/Repo').abi, repoAddr)
    return repo.methods.CREATE_VERSION_ROLE().call()
  }

  return {
    grant: async (repoAddr, grantee) => {
      const acl = await getACL(repoAddr)

      const roleId = await getRoleId(repoAddr)

      const call = acl.methods.grantPermission(grantee, repoAddr, roleId)
      const estimatedGas = call.estimateGas()

      return {
        to: acl.options.address,
        data: call.encodeABI(),
        gas: await getRecommendedGasLimit(web3, estimatedGas),
        gasPrice: network.gasPrice || gasPrice,
      }
    },
  }
}
