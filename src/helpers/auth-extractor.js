const fs = require('fs')
const { promisify } = require('util')
const readFile = promisify(fs.readFile)

const modifiesStateAndIsPublic = de => {
  const blacklist = ['internal', 'private', 'view', 'pure']

  // space words to ensure they are not part of another word
  return blacklist.filter(w => de.indexOf(` ${w} `) != -1).length == 0
}

const typeOrAddress = type => {
  const types = ['address', 'byte', 'uint', 'int', 'bool']

  // check if the type starts with any of the above types, otherwise it is probably
  // a typed contract, so we need to return address for the signature
  return types.filter(t => type.indexOf(t) == 0).length > 0 ? type : 'address'
}

// extracts function signature from function declaration
const getSignature = de => {
  const name = de.match(/function ([^]*?)\(/)[0].replace('function ', '')
  const params = de.match(/\(([^]*?)\)/)[0].replace('(', '').replace(')', '')
    .replace(/\n/gm, '')
    .replace(/\t/gm, '')
    .split(',')
    .map(param => param.split(' ').filter(s => s.length > 0)[0])
    .map(type => typeOrAddress(type))
    .join(',')

  return name + params + ')'
}

const getNotice = de => {
  // capture from @notice to either next '* @' or end of comment '*/'
  const notices = de.match(/(@notice)([^]*?)(\* @|\*\/)/m)
  if (!notices || notices.length == 0) return null

  return notices[0]
    .replace('*/', '').replace('* @', '').replace('@notice ', '')
    .replace(/\n/gm, '').replace(/\t/gm, '')
    .split(' ').filter(x => x.length > 0).join(' ')
}

// extracts required role from function declaration
const getRoles = de => {
  const auths = de.match(/auth.?\(([^]*?)\)/gm)
  if (!auths) return []

  return auths.map(s => s.split('(')[1].split(',')[0].split(')')[0])
}

// Takes the path to a solidity file and extracts public function signatures
// and its auth role if any
module.exports = async sourceCodePath => {
  const sourceCode = await readFile(sourceCodePath, 'utf8')

  // everything between every 'function' and '{' and its @notice
  const funcDec = sourceCode.match(/(@notice|function)(?:[^]*?){/gm)

  if (!funcDec) return []

  return funcDec
    .filter(d => modifiesStateAndIsPublic(d))
    .map(d => ({ sig: getSignature(d), roles: getRoles(d), notice: getNotice(d) }))
}
