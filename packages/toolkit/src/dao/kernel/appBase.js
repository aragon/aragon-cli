import { abi as kernelAbi } from '@aragon/abis/os/artifacts/Kernel'
//
import { useEnvironment } from '../../helpers/useEnvironment'

/**
 * Returns the current app base namesapce for an appId
 *
 * @param {string} dao DAO address
 * @param  {string} environment Envrionment
 * @return {Promise<string>} basesNamespace
 */
export async function getBasesNamespace(dao, environment) {
  const { web3 } = useEnvironment(environment)

  const kernel = new web3.eth.Contract(kernelAbi, dao)
  return kernel.methods.APP_BASES_NAMESPACE().call()
}

/**
 * Returns the current app base address for an appId
 *
 * @param {string} dao DAO address
 * @param {string} appId APP id to get the base of
 * @param  {string} environment Envrionment
 * @return {Promise<string>} currentBaseAddress
 */
export async function getAppBase(dao, appId, environment) {
  const { web3 } = useEnvironment(environment)

  const kernel = new web3.eth.Contract(kernelAbi, dao)
  const basesNamespace = await getBasesNamespace(dao, environment)
  return kernel.methods.getApp(basesNamespace, appId).call()
}
