const { abi } = require('./abi/os/AragonApp')

module.exports = (web3, appAddress) => {
  const app = new web3.eth.Contract(abi, appAddress)
  return app.methods.kernel().call()
}
