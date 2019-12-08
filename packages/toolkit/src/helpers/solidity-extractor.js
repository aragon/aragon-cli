import fs from 'fs'
import { promisify } from 'util'
import { keccak256 } from 'web3-utils'
const readFile = promisify(fs.readFile)

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

const modifiesStateAndIsPublic = declaration =>
  !declaration.match(/\b(internal|private|view|pure|constant)\b/)

// Check if the type starts with any of the basic types, otherwise it is probably
// a typed contract, so we need to return address for the signature
const typeOrAddress = type => {
  return SOLIDITY_BASIC_TYPES.some(t => type.startsWith(t)) ? type : 'address'
}

// Expand shorthands into their full types for calculating function signatures
const expandTypeForSignature = type => {
  return SOLIDITY_SHORTHAND_TYPES_MAP[type] || type
}

// extracts function signature from function declaration
const getSignature = declaration => {
  let [name, params] = declaration
    .match(/^\s*function ([^]*?)\)/m)[1]
    .split('(')

  if (!name) {
    return 'fallback'
  }

  if (params) {
    // Has parameters
    params = params
      .replace(/\n/gm, '')
      .replace(/\t/gm, '')
      .split(',')
      .map(param => param.split(' ').filter(s => s.length > 0)[0])
      .map(type => typeOrAddress(type))
      .map(type => expandTypeForSignature(type))
      .join(',')
  }

  return `${name}(${params})`
}

const getNotice = declaration => {
  // capture from @notice to either next '* @' or end of comment '*/'
  const notices = declaration.match(/(@notice)([^]*?)(\* @|\*\/)/m)
  if (!notices || notices.length === 0) return null

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

// extracts required role from function declaration
const getRoles = declaration => {
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

const extractFunctions = async sourceCode => {
  // Everything between every 'function' and '{' and its @notice.
  const functionDeclarations = sourceCode.match(
    /(@notice|^\s*function)(?:[^]*?){/gm
  )

  if (!functionDeclarations) {
    return []
  }

  const stateModifyingFunctionDeclarations = functionDeclarations
    .filter(functionDeclaration =>
      modifiesStateAndIsPublic(functionDeclaration)
    )
    .map(functionDeclaration => ({
      sig: getSignature(functionDeclaration),
      roles: getRoles(functionDeclaration),
      notice: getNotice(functionDeclaration),
    }))

  return stateModifyingFunctionDeclarations
}

const extractRoles = async functionDescriptors => {
  // Extract all role ids from the function descriptors.
  const roleSet = new Set()
  functionDescriptors.forEach(({ roles }) =>
    roles.forEach(role => roleSet.add(role))
  )
  const roleIds = [...roleSet]

  // Parse role ids into objects.
  // TODO: Name and parameters are currently not being extracted, and it's probably better to get it from an AST instead of the Solidity code. For now, the properties are merely place holders.
  return roleIds.map(id => ({
    id,
    bytes: keccak256(id),
    name: '',
    params: [],
  }))
}

// Given the path to a Solidity file, parses it and returns an object with the form:
/*
  roles: [
    {
      id: "MINT_ROLE",
      bytes: "0x0xbf05b9322505d747ab5880dfb677dc4864381e9fc3a25ccfa184a3a53d02f4b2",
      name: "",
      params: []
    },
    ...
  ],
  functions: [
    {
      sig: "baz(uint32,bool)",
      roles: [ "MINT_ROLE", "BURN_ROLE" ],
      notice: "Sample radspec documentation..."
    },
    ...
  ]
*/
export const extractContractInfo = async sourceCodePath => {
  const sourceCode = await readFile(sourceCodePath, 'utf8')

  const functionDescriptors = await extractFunctions(sourceCode)
  const roleDescriptors = await extractRoles(functionDescriptors)

  return {
    roles: roleDescriptors,
    functions: functionDescriptors,
  }
}
