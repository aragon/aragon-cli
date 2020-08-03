import { useEnvironment } from '../../useEnvironment'
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
  const { web3 } = useEnvironment(environment)

  const daoInstance = new web3.eth.Contract(kernelAbi, dao)
  return daoInstance.methods.acl().call()
}
