import { ethers } from 'ethers'
import { useEnvironment } from '../../helpers/useEnvironment'
import { kernelAbi } from '../../contractAbis'

/**
 * Returns aclAddress for a DAO
 *
 * @param dao DAO address
 * @param environment Envrionment
 * @return aclAddress
 */
export async function getAclAddress(
  dao: string,
  environment: string
): Promise<string> {
  const { provider } = useEnvironment(environment)

  const kernel = new ethers.Contract(dao, kernelAbi, provider)

  return kernel.methods.acl().call()
}
