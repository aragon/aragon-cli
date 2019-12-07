/**
 * @typedef {Object} NetworkConfig
 * @property {number} network_id
 * @property {string} host 'localhost
 * @property {number} port
 * @property {number} gas
 * @property {number} gasPrice
 * @property {string} name
 * @property {WebsocketProvider} provider
 */

/**
 * @typedef {Object} WebsocketProvider
 * @property {any} x
 */

/**
 * @typedef {Object} ApmConfig
 * @property {string} ens-registry // Unresolved issue https://stackoverflow.com/questions/49358939/how-to-document-field-with-dash-with-jsdoc
 * @property {Object} ipfs
 */

/**
 * @typedef {Object} ArappConfig
 * @property {Object.<string, ArappConfigEnvironment>} environments
 * @property {Object.<string, AppDependency>} dependencies
 * @property {RoleDefinition[]} roles
 * @property {Object} env
 * @property {string} path 'contracts/Finance.sol'
 * @property {string} name 'finance.aragonpm.eth'
 */

/**
 * @typedef {Object} ArappConfigEnvironment
 * @property {string} registry "0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1"
 * @property {string} appName "finance.aragonpm.eth"
 * @property {string} network "rpc"
 */

/**
 * @typedef {Object} AppDependency
 * @property {string} appName
 * @property {string} version
 * @property {string} initParam
 * @property {string} state
 * @property {AppDependencyPermission[]} requiredPermissions
 *
 * @typedef {Object} AppDependencyPermission
 * @property {string} name "TRANSFER_ROLE"
 * @property {string} params "*"
 */

/**
 * @typedef {Object} RoleDefinition
 * @property {string} name "Create new payments"
 * @property {string} id "CREATE_PAYMENTS_ROLE"
 * @property {string[]} params ["Token address","Receiver address"]
 */
