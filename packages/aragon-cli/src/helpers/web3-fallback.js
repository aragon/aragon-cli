const Web3 = require('web3')

const ensureWeb3 = async (network) => {
  let web3

  try {
    web3 = new Web3(network.provider)
    const connected = await web3.eth.net.isListening()
    if (connected) return web3
  } catch (err) {
    throw new Error(`Web3 cannot connect using the network provider.

Make sure 'aragon devchain' is running or your provider settings are correct.

For more info you can check the Truffle docs on network configuration: https://truffleframework.com/docs/truffle/reference/configuration#networks`)
  }
}

module.exports = { ensureWeb3 }
