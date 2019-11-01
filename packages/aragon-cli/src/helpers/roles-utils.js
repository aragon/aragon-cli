const path = require('path')
const astParser = require('./ast-extractor')
const { keyBy } = require('lodash')

/**
 * @typedef  {Object} ArappRole
 * @property {string} name     - Pretty name "Create new payments"
 * @property {string} id       - Role ID "CREATE_PAYMENTS_ROLE"
 * @property {string[]} params - ['Token address', 'Receiver address']
 */

/**
 * @typedef  {Object} Arapp
 * @property {string} path       - "contracts/Finance.sol"
 * @property {ArappRole[]} roles - Role ID "CREATE_PAYMENTS_ROLE"
 */

/**
 * Wrapper to type arapp roles. Used for testing
 * @param  {string} arappPath path to arapp.json
 * @return {ArappRole[]} Arapp roles
 */
const getArappRoles = arappPath => {
  return require(arappPath).roles
}

/**
 * Returns an array of differences between the roles used in the contract
 * and the roles defined in the arapp.json as formated error messages
 *
 * Note: This functionality is abstracted to be more testable, the returned
 * string can be formated and converted to an Error by another function
 * @param  {string} buildArtifactPath
 *         Path to the contract artifact
 * @param  {ArappRole[]} arappRoles
 *         Path to arapp.json
 * @return {string[]} errors
 *         ['EXTRA_UNUSED_ROLE is declared but never used',
 *          'Function executePayment uses undeclared role EXECUTE_PAYMENTS_ROLE',]
 */
const diffRolesBetweenContractAndArapp = (buildArtifactPath, arappRoles) => {
  const contractRoles = astParser.extractRoles(buildArtifactPath)

  // Convert to object for uniqueness and faster lookup
  const contractRolesObj = keyBy(contractRoles, 'id')
  const arappRolesObj = keyBy(arappRoles, 'id')

  const errors = []

  for (const arappRole of arappRoles) {
    if (!contractRolesObj[arappRole.id]) {
      errors.push(`${arappRole.id} is declared but never used`)
    }
  }

  for (const contractRole of contractRoles) {
    if (!arappRolesObj[contractRole.id]) {
      errors.push(
        `Function ${contractRole.functionName} uses undeclared role ${contractRole.id}`
      )
    } else {
      const contractCount = (contractRole.params || []).length
      const arappCount = (arappRolesObj[contractRole.id].params || []).length
      if (contractCount !== arappCount) {
        errors.push(
          `Function ${contractRole.functionName} uses ${contractRole.id} with ${contractCount} params but requires ${arappCount}`
        )
      }
    }
  }

  return errors
}

/**
 * Ready to use function to assert that there are no differences between
 * the role usage in the main contract and the roles defined in arapp.json
 * @param  {string} cwd
 *         CWD
 * @param  {Arapp} module
 *         arapp.json contents
 * @return {void}
 */
const assertContractRoles = (cwd, module) => {
  // "contracts/Finance.sol" => "Finance"
  const contractName = path.parse(module.path).name
  const buildArtifactPath = path.resolve(
    cwd,
    `build/contracts/${contractName}.json`
  )
  const roleDiffs = diffRolesBetweenContractAndArapp(
    buildArtifactPath,
    module.roles
  )
  if (roleDiffs.length) {
    const roleErrorList = roleDiffs.map(s => ` - ${s}`).join('\n')
    throw Error(
      `Role usage and declarations in arapp.json do not match: \n${roleErrorList}`
    )
  }
}

module.exports = {
  getArappRoles,
  diffRolesBetweenContractAndArapp,
  assertContractRoles,
}
