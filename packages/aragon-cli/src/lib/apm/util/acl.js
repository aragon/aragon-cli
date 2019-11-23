import { getRecommendedGasLimit } from '../../../util'
import { abi as aclAbi } from '@aragon/os/build/contracts/ACL'
import { abi as aragonAppAbi } from '@aragon/os/build/contracts/AragonApp'
import { abi as kernelAbi } from '@aragon/os/build/contracts/Kernel'
import { abi as repoAbi } from '@aragon/os/build/contracts/Repo'

export default web3 => {
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
      }
    },
  }
}
