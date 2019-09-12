module.exports = (abi, newInstanceFunctionName, initArgs) => {
  const methodABI = abi.find(method => method.name === newInstanceFunctionName)

  if (!methodABI) {
    throw new Error(
      `No method ${newInstanceFunctionName} defined in the template ABI`
    )
  } else {
    try {
      // parse array parameters from string inputs
      for (var i in methodABI.inputs) {
        if (methodABI.inputs[i].type.includes('[')) {
          initArgs[i] = JSON.parse(
            initArgs[i].replace(new RegExp("'", 'g'), '"')
          )
        }
      }
      return initArgs
    } catch (e) {
      throw new Error(
        'Invalid parms for the new template instance. Check the arguments passed with the --template-args flag\n' +
          e.message
      )
    }
  }
}
