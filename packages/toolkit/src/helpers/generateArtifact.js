import namehash from 'eth-ens-namehash'
import { keccak256 } from 'web3-utils'
import { encodeFunctionSignature } from 'web3-eth-abi'
//
import { SOLIDITY_FILE } from './constants'
import { extractContractInfo } from './solidity-extractor'

/**
 * @typedef {Object} FunctionInfo
 * @property {string} sig "functionName(address,unit)"
 * @property {Object[]} roles
 * @property {string} notice Multiline notice text
 * @property {Object} [abi] Abi of the function
 */

/**
 * @param {Object} environments
 * @return {Object}
 */
const decorateEnvrionmentsWithAppId = (environments) => {
  const decoratedEnvrionment = {}
  for (const [key, value] of Object.entries(environments)) {
    decoratedEnvrionment[key] = {
      ...value,
      appId: namehash.hash(value.appName),
    }
  }
  return decoratedEnvrionment
}

/**
 * Appends the abi of a function to the functions array
 * @param {FunctionInfo[]} functions functions
 * @param {Object[]} abi ABI
 * @return {FunctionInfo[]} functions with appended ABI
 */
function decorateFunctionsWithAbi(functions, abi) {
  const abiFunctions = abi.filter((elem) => elem.type === 'function')
  return functions.map((f) => ({
    ...f,
    abi: abiFunctions.find(
      (functionAbi) =>
        encodeFunctionSignature(functionAbi) === encodeFunctionSignature(f.sig)
    ),
  }))
}

/**
 * @param {Object} roles
 * @return {Object}
 */
const getRoles = (roles) =>
  roles.map((role) => Object.assign(role, { bytes: keccak256(role.id) }))

/**
 * Construct artifact object
 *
 * @param {ArappConfigFile} arapp Arapp config file
 * @param {Object[]} abi ABI
 * @param {string} sourceCode Solidity file
 * @return {Object} artifact
 */
export async function generateApplicationArtifact(arapp, abi, sourceCode) {
  // Includes appId for each environemnt
  const environments = decorateEnvrionmentsWithAppId(arapp.environments)

  // Given a Solidity file, parses it and returns an object with the form:
  // > {roles: [{ },...], functions: [{ },...]}
  const { functions, roles } = await extractContractInfo(sourceCode)

  // Includes abi for each function
  // > [{ sig: , role: , notice: , abi: }]
  const functionsWithAbi = decorateFunctionsWithAbi(functions, abi)

  const arappRoles = getRoles(arapp.roles)

  if (arappRoles !== roles) {
    console.log(
      'Warning: The roles defined on the arapp.json not match those on the contract file'
    )
  }

  // TODO: Add deprectaedFunctions logic

  return {
    ...arapp,
    flattenedCode: `./${SOLIDITY_FILE}`,
    environments,
    roles,
    functions: functionsWithAbi,
    abi,
  }
}
