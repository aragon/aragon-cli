import Web3 from 'web3'

export const ensureWeb3 = async (network) => {
  let web3

  try {
    web3 = new Web3(network.provider, {
      timeout: 500,
      clientConfig: {
        keepalive: false,
        keepaliveInterval: 500,
      },
    })
    const connected = await web3.eth.net.isListening()
    if (connected) return web3
  } catch (err) {
    throw new Error(`Web3 cannot connect using the network provider.

Make sure 'aragon devchain' or Frame are running, and your provider settings are correct.

For more info you can check the Truffle docs on network configuration: https://truffleframework.com/docs/truffle/reference/configuration#networks`)
  }
}
