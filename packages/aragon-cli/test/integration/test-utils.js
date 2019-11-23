import Web3 from 'web3'
import execa from 'execa'

export const isValidTxHash = txHash => /^0x([A-Fa-f0-9]{64})$/.test(txHash)
export const isAddress = Web3.utils.isAddress

export const getLocalWeb3 = async () => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(`http://localhost:8545`)
  )
  const connected = await web3.eth.net.isListening()
  if (!connected) throw new Error('Web3 connection failed')
  return web3
}

/**
 * Deploys a new DAO calling 'aragon dao new' and returns it's address
 * @return {Promise<string>} daoAddress
 */
export const getNewDaoAddress = async () => {
  const { stdout: daoNewRes } = await execa('npx', ['aragon', 'dao', 'new'])
  const dao = (daoNewRes.split('DAO: ')[1] || '').trim()
  if (!isAddress(dao))
    throw Error(`Error parsing aragon dao new output: ${daoNewRes}`)
  return dao
}
