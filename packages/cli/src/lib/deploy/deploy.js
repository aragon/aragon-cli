import {
  getRecommendedGasLimit,
  expandLink,
  useEnvironment,
} from '@aragon/toolkit'

/**
 * @typedef {Object} LibraryLink
 * @property {string} regex Regex to find the library placeholder
 * @property {string} addressBytes Address without 0x prefix
 * @property {string} name Library name
 */

/**
 * Replace libraries from the raw bytecode
 * @param  {string} bytecode Raw bytecode
 * @param  {LibraryLink[]} links Library links
 * @return {string} bytecode with replaced library addresses
 */
export const linkLibraries = (bytecode, links) => {
  for (const link of links.map(expandLink)) {
    bytecode = bytecode.replace(link.regex, link.addressBytes)
    if (!bytecode.includes(link.addressBytes)) {
      throw Error(`Could not link library ${link.name}`)
    }
  }
  return bytecode
}

/**
 * @typedef  {Object} DeployContractReturnData
 * @property {string} transactionHash Tx hash
 * @property {string} address Address of the deployed contract
 */

/**
 * Deploy contract wrapper
 * @param  {string} param.bytecode Deploy bytecode with libraries substituted
 * @param  {any[]}  param.abi Contract ABI
 * @param  {any[]}  param.init Arguments for the initialize function
 * @param  {string} environment Envrionment
 * @return {Promise<DeployContractReturnData>} Tx hash and deployed contract address
 */
export const deployContract = async (bytecode, abi, init, environment) => {
  const { web3, apmOptions, gasPrice } = useEnvironment(environment)

  // Mappings allow to pass certain init parameters that get replaced for their actual value
  // const mappingMask = key => `@ARAGON_${key}`
  const mappings = {
    '@ARAGON_ENS': apmOptions.ensRegistryAddress, // <ens> to ens addr
  }
  const initArguments = init.map(value => mappings[value] || value)

  const accounts = await web3.eth.getAccounts()

  const contract = new web3.eth.Contract(abi, { data: bytecode })
  const deployTx = contract.deploy({ arguments: initArguments })
  const gas = await getRecommendedGasLimit(web3, await deployTx.estimateGas())

  /**
   * @type {string}
   */
  let transactionHash

  const deployPromise = deployTx.send({ from: accounts[0], gasPrice, gas })
  deployPromise.on('transactionHash', _transactionHash => {
    transactionHash = _transactionHash
  })
  const instance = await deployPromise

  if (!instance.options.address) {
    throw new Error('Contract deployment failed')
  }

  return {
    transactionHash,
    address: instance.options.address,
    instance,
  }
}
