const { isString } = require('lodash')
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

const ArgumentIds = {
  BLOCK_NUMBER_PARAM_ID: '200',
  TIMESTAMP_PARAM_ID: '201',
  ORACLE_PARAM_ID: '203',
  LOGIC_OP_PARAM_ID: '204',
  PARAM_VALUE_PARAM_ID: '205',
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
    const cleanStr = str
      .replace(/^\[(.+)\]$/, (m, p1) => p1)
      .replace(/ /g, '')
      .replace(/"/g, '')
      .replace(/'/g, '')

    const [, idStr, opStr, valueStr] = /^(.+?),(.+?),(.+)$/.exec(cleanStr)
    const id = ArgumentIds[idStr.toUpperCase()] || idStr
    const op = Op[opStr.toUpperCase()] || opStr

    const value =
      id === ArgumentIds.LOGIC_OP_PARAM_ID
        ? convertStringToLogicParam(valueStr)
        : valueStr

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
    .or(parseNumber(param.value))

  return encodedParam.toString()
}

/**
 * Convert an ACL logic parameter from string
 * to an encoded bn.js uint
 * @param {string} str Param string
 * @returns {BN} Encoded parameter
 */
function convertStringToLogicParam(str) {
  try {
    str = str
      .replace(/encodeIfElse/i, '')
      .replace(/encodeOperator/i, '')
      .replace(/^\((.+)\)$/, (m, p1) => p1)
      .replace(/^\[(.+)\]$/, (m, p1) => p1)
      .replace(/ /g, '')
      .replace(/"/g, '')
      .replace(/'/g, '')

    const params = str.split(',')

    switch (params.length) {
      case 2:
        return encodeOperator(params[0], params[1])
      case 3:
        return encodeIfElse(params[0], params[1], params[2])
      default:
        throw new Error('Invalid parameters.')
    }
  } catch (e) {
    throw new Error("Can't parse logic parameters.")
  }
}

/**
 * Encode an operator
 * @param {string} param1 Left param
 * @param {string} param2 Right param
 * @returns {BN} Encoded operator
 */
function encodeOperator(param1, param2) {
  return new BN(param1).add(new BN(param2).shln(32))
}

/**
 * Encode an if-else condition
 * Original logic: https://github.com/aragon/aragonOS/blob/v4.2.1/contracts/test/helpers/ACLHelper.sol
 * @param {string} condition Condition param
 * @param {string} successParam Success param
 * @param {string} failureParam Failure param
 * @returns {BN} Encoded condition
 */
function encodeIfElse(condition, successParam, failureParam) {
  return new BN(condition)
    .add(new BN(successParam).shln(32))
    .add(new BN(failureParam).shln(64))
}

/**
 * Parse a decimal or hexadecimal number
 * @param {string|number} number Number
 * @returns {BN} bn.js number
 */
function parseNumber(number) {
  return isString(number) && number.substr(0, 2) === '0x'
    ? new BN(number.substr(2), 16)
    : new BN(number)
}

module.exports = { encodeParam, convertStringToParam, Op }
