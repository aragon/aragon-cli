import { ZERO_ADDRESS } from '../helpers/constants'
//
const aragonAppAbi = require('@aragon/os/build/contracts/AragonApp').abi

/**
 * Return kernel address for an Aragon app
 *
 * @param {Object} web3 web3
 * @param {string} appAddress App address
 * @returns {Promise<string>} Kernel address
 */
module.exports = async (web3, appAddress) => {
  const app = new web3.eth.Contract(aragonAppAbi, appAddress)
  const kernel = await app.methods.kernel().call()

  if (kernel === ZERO_ADDRESS)
    throw new Error(`No kernel found for ${appAddress}`)

  return kernel
}
