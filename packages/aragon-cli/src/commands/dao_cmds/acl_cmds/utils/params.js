const BN = require('bn.js')

/**
 * @typedef {Object} AclParam
 * @property {string} id
 * @property {string} op
 * @property {string} value
 */

const Op = {
  NONE: '0',
  EQ: '1',
  NEQ: '2',
  GT: '3',
  LT: '4',
  GTE: '5',
  LTE: '6',
  RET: '7',
  NOT: '8',
  AND: '9',
  OR: '10',
  XOR: '11',
  IF_ELSE: '12',
}

/**
 * Convert a string to an AclParam object
 * The string must follow the pattern: "[<id>, <op>, <value>]"
 * Where <id> is the param id, <op> is the operation, either as a string or
 * as a number, and <value> is the value. You can omit the brackets.
 * examples: "[0, GT, 42]", "0, NEQ, 33",
 * "[1, EQ, 0x6E14E589477AA08d139D55a871535c0579B1BB84]"
 * @param {string} str String param
 * @returns {AclParam} Param object
 */
function convertStringToParam(str) {
  try {
    str = str
      .replace(/^\[(.+)\]$/, (m, p1) => p1)
      .replace(/ /g, '')
      .replace(/"/g, '')
      .replace(/'/g, '')

    let [id, op, value] = str.split(',')

    if (Number.isInteger(Op[op])) op = Op[op]

    if (value.substr(0, 2) === '0x') value = new BN(value.substr(2), 16)

    return { id, op, value }
  } catch (err) {
    throw new Error(`Can't parse param ${str}`)
  }
}

/**
 * Encode an ACL parameter to uint256 string
 * @param {AclParam} param ACL Parameter
 * @returns {string} Encoded param
 */
function encodeParam(param) {
  const encodedParam = new BN(param.id)
    .shln(248)
    .or(new BN(param.op).shln(240))
    .or(new BN(param.value))

  return encodedParam.toString()
}

module.exports = { encodeParam, convertStringToParam, Op }
