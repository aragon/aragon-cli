import { abi as aragonAppAbi } from '@aragon/os/build/contracts/AragonApp'

export default (web3, appAddress) => {
  const app = new web3.eth.Contract(aragonAppAbi, appAddress)
  return app.methods.kernel().call()
}
