const aragonAppAbi = require('@aragon/os/build/contracts/AragonApp').abi

module.exports = (web3, appAddress) => {
  const app = new web3.eth.Contract(aragonAppAbi, appAddress)
  return app.methods.kernel().call()
}
