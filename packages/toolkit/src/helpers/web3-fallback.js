export const ensureWeb3 = async web3 => {
  try {
    return await web3.eth.net.isListening()
  } catch (err) {
    throw new Error(`Web3 cannot connect using the network provider.
Make sure 'aragon devchain' or Frame are running, and your provider settings are correct.
For more info you can check the Truffle docs on network configuration: https://truffleframework.com/docs/truffle/reference/configuration#networks`)
  }
}
