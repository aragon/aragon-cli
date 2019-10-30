const { getRecommendedGasLimit } = require('../../../util')
const aclAbi = require('@aragon/os/build/contracts/ACL').abi
const aragonAppAbi = require('@aragon/os/build/contracts/AragonApp').abi
const kernelAbi = require('@aragon/os/build/contracts/Kernel').abi
const repoAbi = require('@aragon/os/build/contracts/Repo').abi

module.exports = ({ web3, gasPrice, network }) => {
  const getACL = async repoAddr => {
    const repo = new web3.eth.Contract(aragonAppAbi, repoAddr)
    const daoAddr = await repo.methods.kernel().call()
    const dao = new web3.eth.Contract(kernelAbi, daoAddr)
    const aclAddr = await dao.methods.acl().call()

    return new web3.eth.Contract(aclAbi, aclAddr)
  }

  const getRoleId = async repoAddr => {
    const repo = new web3.eth.Contract(repoAbi, repoAddr)
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
