import { abi as aragonAppAbi } from '@aragon/abis/os/artifacts/AragonApp'
//
import { ZERO_ADDRESS } from '../helpers/constants'
import { configEnvironment } from '../helpers/configEnvironment'

/**
 * Return kernel address for an Aragon app
 *
 * @param {string} appAddress App address
 * @param  {string} environment Envrionment
 * @returns {Promise<string>} Kernel address
 */
export default async (appAddress, environment) => {
  const { web3 } = configEnvironment(environment)

  const app = new web3.eth.Contract(aragonAppAbi, appAddress)
  const kernel = await app.methods.kernel().call()

  if (kernel === ZERO_ADDRESS)
    throw new Error(`No kernel found for ${appAddress}`)

  return kernel
}
