import { useEnvironment } from '../../helpers/useEnvironment'
import { aragonAppAbi } from '../../contractAbis'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Return kernel address for an Aragon app
 *
 * @param appAddress App address
 * @param environment Envrionment
 * @returns Kernel address
 */
export async function getKernelAddress(
  appAddress: string,
  environment: string
): Promise<string> {
  const { web3 } = useEnvironment(environment)

  const app = new web3.eth.Contract(aragonAppAbi, appAddress)
  const kernel = await app.methods.kernel().call()

  if (kernel === ZERO_ADDRESS)
    throw new Error(`No kernel found for ${appAddress}`)

  return kernel
}
