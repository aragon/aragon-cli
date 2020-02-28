import { keccak256 } from 'web3-utils'
import { RoleWithBytes as Role } from '../types'

interface ExtractedFunctions {
  sig: string
  roles: string[]
  notice: string
}

export interface ExtractedContractInfo {
  roles: Role[]
  functions: ExtractedFunctions[]
}

// See https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#types
const SOLIDITY_SHORTHAND_TYPES_MAP = {
  address: 'address',
  bytes: 'bytes',
  uint: 'uint256',
  int: 'int256',
  ufixed: 'ufixed128x18',
  fixed: 'fixed128x18',
  bool: 'bool',
  string: 'string',
}

const SOLIDITY_BASIC_TYPES = Object.keys(SOLIDITY_SHORTHAND_TYPES_MAP)

function hasKey<O>(obj: O, key: keyof any): key is keyof O {
  return key in obj
}

// In the all functions that accept the parameter `declaration` it referes
// to a string similar to the example below
//
// declaration = `/**
//  * @notice Increment the counter by `step`
//  * @param step Amount to increment by
//  */
// function increment(uint256 step) external auth(INCREMENT_ROLE)`

/**
 * Based on a function declaration string checks if modifies state and is public
 * @param declaration multiline function declaration with comments
 * @return false
 */
const modifiesStateAndIsPublic = (declaration: string): boolean =>
  !declaration.match(/\b(internal|private|view|pure|constant)\b/)

/**
 * Check if the type starts with any of the basic types, otherwise it is probably
 * a typed contract, so we need to return address for the signature
 * @param type "address" | "ERC20ContractInstance"
 * @return "address"
 */
const typeOrAddress = (type: string): string =>
  SOLIDITY_BASIC_TYPES.some(t => type.startsWith(t)) ? type : 'address'

/**
 * Expand shorthands into their full types for calculating function signatures
 * @param type "uint"
 * @return "uint256"
 */
const expandTypeForSignature = (type: string): string => {
  if (hasKey(SOLIDITY_SHORTHAND_TYPES_MAP, type)) {
    return SOLIDITY_SHORTHAND_TYPES_MAP[type]
  }
  return type
}

/**
 * extracts function signature from function declaration
 * @param declaration multiline function declaration with comments
 */
const getSignature = (declaration: string): string => {
  const declarationMatch = declaration.match(/^\s*function ([^]*?)\)/m)
  if (!declarationMatch) throw Error('Not a function')

  const [name, params] = declarationMatch[1].split('(')

  if (!name) {
    return 'fallback'
  }

  if (params) {
    // Has parameters
    const parsedParams = params
      .replace(/\n/gm, '')
      .replace(/\t/gm, '')
      .split(',')
      .map(param => param.split(' ').filter(s => s.length > 0)[0])
      .map(type => typeOrAddress(type))
      .map(type => expandTypeForSignature(type))
      .join(',')

    return `${name}(${parsedParams})`
  }

  return `${name}()`
}

/**
 * Get notice from function declaration
 * @param declaration multiline function declaration with comments
 */
const getNotice = (declaration: string): string => {
  // capture from @notice to either next '* @' or end of comment '*/'
  const notices = declaration.match(/(@notice)([^]*?)(\* @|\*\/)/m)
  if (!notices || notices.length === 0) return ''

  return notices[0]
    .replace('*/', '')
    .replace('* @', '')
    .replace('@notice ', '')
    .replace(/\n/gm, '')
    .replace(/\t/gm, '')
    .split(' ')
    .filter(x => x.length > 0)
    .join(' ')
}

/**
 * Extracts required role from function declaration
 * @param declaration multiline function declaration with comments
 * @return roles = ["INCREMENT_ROLE"]
 */
const getRoles = (declaration: string): string[] => {
  const auths = declaration.match(/auth.?\(([^]*?)\)/gm)
  if (!auths) return []

  return auths.map(
    authStatement =>
      authStatement
        .split('(')[1]
        .split(',')[0]
        .split(')')[0]
  )
}

/**
 * Extracts relevant function information from their source code
 * Only returns functions that are state modifying
 * @param sourceCode Full solidity source code
 */
const extractFunctions = (sourceCode: string): ExtractedFunctions[] => {
  // Everything between every 'function' and '{' and its @notice.
  const functionDeclarations = sourceCode.match(
    /(@notice|^\s*function)(?:[^]*?){/gm
  )

  if (!functionDeclarations) {
    return []
  }

  return functionDeclarations
    .filter(functionDeclaration =>
      modifiesStateAndIsPublic(functionDeclaration)
    )
    .map(functionDeclaration => ({
      sig: getSignature(functionDeclaration),
      roles: getRoles(functionDeclaration),
      notice: getNotice(functionDeclaration),
    }))
}

/**
 * Extracts all role ids from the function descriptors and parses them into objects
 * @param functionDescriptors
 */
const extractRolesFromFunctions = (
  functionDescriptors: ExtractedFunctions[]
): Role[] => {
  // Extract all role ids from the function descriptors.
  const roleSet: Set<string> = new Set()
  functionDescriptors.forEach(({ roles }) =>
    roles.forEach(role => roleSet.add(role))
  )
  const roleIds = [...roleSet]

  // Parse role ids into objects.
  // TODO: Name and parameters are currently not being extracted,
  // and it's probably better to get it from an AST instead of
  // the Solidity code. For now, the properties are merely place holders.
  return roleIds.map(id => ({
    id,
    bytes: keccak256(id),
    name: '',
    params: [],
  }))
}

/**
 * Given a Solidity file, parses relevant functions and roles info
 * @param sourceCode Full .sol source code
 * @return roles: [{
 *    id: "MINT_ROLE",
 *    bytes: "0x0xbf05b9322505d747ab5880dfb677dc4864381e9fc3a25ccfa184a3a53d02f4b2",
 *    name: "",
 *    params: []
 *  }, ... ],
 *  functions: [{
 *    sig: "baz(uint32,bool)",
 *    roles: [ "MINT_ROLE", "BURN_ROLE" ],
 *    notice: "Sample radspec documentation..."
 *  }, ... ]
 * }
 */
export const extractContractInfo = (
  sourceCode: string
): ExtractedContractInfo => {
  const functionDescriptors = extractFunctions(sourceCode)
  const roleDescriptors = extractRolesFromFunctions(functionDescriptors)

  return {
    roles: roleDescriptors,
    functions: functionDescriptors,
  }
}
