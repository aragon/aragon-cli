import { useEnvironment } from '../../useEnvironment'
import { kernelAbi } from '../../contractAbis'

/**
 * Returns the current app base namesapce for an appId
 *
 * @param dao DAO address
 * @param environment Envrionment
 * @return basesNamespace
 */
export async function getBasesNamespace(
  dao: string,
  environment: string
): Promise<string> {
  const { web3 } = useEnvironment(environment)

  const kernel = new web3.eth.Contract(kernelAbi, dao)
  return kernel.methods.APP_BASES_NAMESPACE().call()
}

/**
 * Returns the current app base address for an appId
 *
 * @param dao DAO address
 * @param appId APP id to get the base of
 * @param environment Envrionment
 * @return currentBaseAddress
 */
export async function getAppBase(
  dao: string,
  appId: string,
  environment: string
): Promise<string> {
  const { web3 } = useEnvironment(environment)

  const kernel = new web3.eth.Contract(kernelAbi, dao)
  const basesNamespace = await getBasesNamespace(dao, environment)
  return kernel.methods.getApp(basesNamespace, appId).call()
}
