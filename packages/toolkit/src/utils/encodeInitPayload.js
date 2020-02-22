import abi from 'web3-eth-abi'

export default function encodeInitPayload(
  contractAbi,
  initFunctionName,
  initArgs
) {
  const methodABI = contractAbi.find(method => method.name === initFunctionName)

  if (!methodABI) {
    return '0x'
  } else {
    try {
      // parse array parameters from string inputs
      for (const i in methodABI.inputs) {
        if (methodABI.inputs[i].type.includes('[')) {
          initArgs[i] = JSON.parse(
            initArgs[i].replace(new RegExp("'", 'g'), '"')
          )
        }
      }
      return abi.encodeFunctionCall(methodABI, initArgs)
    } catch (e) {
      throw new Error(
        'Invalid initialization params for app. Check the arguments passed with the --app-init-args flag\n' +
          e.message
      )
    }
  }
}
