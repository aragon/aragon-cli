const fs = require('fs')
const { promisify } = require('util')
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
  let [name, params] = declaration.match(/function ([^]*?)\)/)[1].split('(')

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

// Takes the path to a solidity file and extracts public function signatures,
// its auth role if any and its notice statement
module.exports = async sourceCodePath => {
  const sourceCode = await readFile(sourceCodePath, 'utf8')

  // everything between every 'function' and '{' and its @notice
  const funcDecs = sourceCode.match(/(@notice|^\s*function)(?:[^]*?){/gm)

  if (!funcDecs) return []

  return funcDecs
    .filter(dec => modifiesStateAndIsPublic(dec))
    .map(dec => ({
      sig: getSignature(dec),
      roles: getRoles(dec),
      notice: getNotice(dec),
    }))
}
