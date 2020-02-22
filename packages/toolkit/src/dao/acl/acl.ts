import { getRecommendedGasLimit } from '../utils/getRecommendedGasLimit'
import { kernelAbi, repoAbi, aclAbi } from '../../contractAbis'
import Web3 from 'web3'

export default function acl(
  web3: Web3
): {
  grant: (
    repoAddr: string,
    granteeAddress: string
  ) => Promise<{
    to: string
    data: string
    gas: number
  }>
} {
  async function getGrantCreateVersionRoleTx(
    repoAddr: string,
    granteeAddress: string
  ): Promise<{
    to: string
    data: string
    gas: number
  }> {
    const repo = new web3.eth.Contract(repoAbi, repoAddr)

    // Get ACL
    const daoAddr = await repo.methods.kernel().call()
    const dao = new web3.eth.Contract(kernelAbi, daoAddr)
    const aclAddr = await dao.methods.acl().call()
    const acl = new web3.eth.Contract(aclAbi, aclAddr)

    // Get the role ID of CREATE_VERSION_ROLE
    const roleId = await repo.methods.CREATE_VERSION_ROLE().call()

    const call = acl.methods.grantPermission(granteeAddress, repoAddr, roleId)
    const estimatedGas = call.estimateGas()

    return {
      to: acl.options.address,
      data: call.encodeABI(),
      gas: await getRecommendedGasLimit(web3, estimatedGas),
    }
  }

  return {
    grant: getGrantCreateVersionRoleTx,
  }
}
