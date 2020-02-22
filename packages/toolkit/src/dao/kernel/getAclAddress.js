import { abi as kernelAbi } from '@aragon/abis/os/artifacts/Kernel'
//
import { useEnvironment } from '../../helpers/useEnvironment'

/**
 * Returns aclAddress for a DAO
 *
 * @param {string} dao DAO address
 * @param  {string} environment Envrionment
 * @return {Promise<string>} aclAddress
 */
export default async function getAclAddress(dao, environment) {
  const { web3 } = useEnvironment(environment)

  const daoInstance = new web3.eth.Contract(kernelAbi, dao)
  return daoInstance.methods.acl().call()
}
