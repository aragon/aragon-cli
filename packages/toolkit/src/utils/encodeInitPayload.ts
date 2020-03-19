import web3EthAbiUntyped, { AbiCoder } from 'web3-eth-abi'
import { AbiItem } from 'web3-utils'

// Fix necessary due to wrong type exports in web3-eth-abi
const web3EthAbi: AbiCoder = web3EthAbiUntyped as any

export function encodeInitPayload(
  contractAbi: AbiItem[],
  initFunctionName: string,
  initArgs: any[]
): string {
  const methodABI = contractAbi.find(method => method.name === initFunctionName)

  if (!methodABI) {
    return '0x'
  } else {
    try {
      // parse array parameters from string inputs
      if (methodABI.inputs)
        methodABI.inputs.forEach((input, i) => {
          if (input.type.includes('[')) {
            initArgs[i] = JSON.parse(
              initArgs[i].replace(new RegExp("'", 'g'), '"')
            )
          }
        })
      return web3EthAbi.encodeFunctionCall(methodABI, initArgs)
    } catch (e) {
      throw new Error(
        'Invalid initialization params for app. Check the arguments passed with the --app-init-args flag\n' +
          e.message
      )
    }
  }
}
