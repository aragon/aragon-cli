/**
 * @typedef {Object} ArappConfigEnvironment
 * @property {string} registry '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'
 * @property {string} appName 'finance.aragonpm.eth'
 * @property {string} wsRPC 'ws://my.rinkeby.dnp.dappnode.eth:8546'
 * @property {string} network 'rpc'
 */

/**
 * @typedef {Object} ArappConfig
 * @property {Object.<string, ArappConfigEnvironment>} environments
 * @property {Object} dependencies
 * @property {Object[]} roles
 * @property {Object} env
 * @property {string} path 'contracts/Finance.sol'
 * @property {string} name 'finance.aragonpm.eth'
 */

/**
 * @typedef {Object} Provider
 * @property {boolean} isProvider
 *
 * @callback ProviderCallback
 * @return {Provider}
 */

/**
 * @typedef {Object} TruffleNetwork
 * @property {number} network_id 15
 * @property {(Provider|ProviderCallback} [provider]
 * @property {string} [host] Is used with port if no provider: 'localhost'
 * @property {number} [port] Is used with host if no provider: 8545
 * @property {number} gas Block gas: 6.9e6
 * @property {number} [gasPrice] 15000000001
 */

/**
 * @typedef {Object} EnvironmentJson
 * @property {Object} apm { "ipfs": { "gateway": "https://ipfs.eth.aragon.network/ipfs" } }
 * @property {string} registry "0x98df287b6c145399aaa709692c8d308357bc085d"
 * @property {string} wsRPC "wss://rinkeby.eth.aragon.network/ws"
 * @property {string} network "rinkeby"
 */

/**
 * @type {Object.<string, EnvironmentJson>}
 * where key: "aragon:local" | "aragon:staging" | "aragon:mainnet"
 */
