import BN from 'bn.js'

interface AclParam {
  id: string
  op: string
  value: string
}

/**
 * ACL operators. See https://hack.aragon.org/docs/aragonos-ref#parameter-interpretation
 * for more information.
 */
export const Op: { [op: string]: string } = {
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

const ArgumentIds: { [argument: string]: string } = {
  BLOCK_NUMBER_PARAM_ID: '200',
  TIMESTAMP_PARAM_ID: '201',
  ORACLE_PARAM_ID: '203',
  LOGIC_OP_PARAM_ID: '204',
  PARAM_VALUE_PARAM_ID: '205',
}

/**
 * Convert a string to an AclParam object
 * The string must follow the pattern: "<id>, <op>, <value>"
 * Where <id> is the param id, <op> is the operation, either as a string or
 * as a number, and <value> is the value.
 * examples: "LOGIC_OP_PARAM_ID, OR, (1,2)", "0, GT, 42",
 * "1, EQ, 0x6E14E589477AA08d139D55a871535c0579B1BB84"
 * @param str String param
 * @returns Param object
 */
export function convertStringToParam(str: string): AclParam {
  try {
    // Remove square brackets, quotes and spaces
    const cleanStr = str
      .replace(/^\[(.+)\]$/, (m, p1) => p1)
      .replace(/ /g, '')
      .replace(/"/g, '')
      .replace(/'/g, '')

    const stringParts = /^(.+?),(.+?),(.+)$/.exec(cleanStr)
    if (!stringParts) throw Error('Regex exec failed')

    const [, idStr, opStr, valueStr] = stringParts
    const id = ArgumentIds[idStr.toUpperCase()] || idStr
    const op = Op[opStr.toUpperCase()] || opStr

    const value =
      id === ArgumentIds.LOGIC_OP_PARAM_ID
        ? convertStringToLogicParam(valueStr).toString()
        : valueStr

    return { id, op, value }
  } catch (err) {
    throw new Error(`Can't parse param ${str}`)
  }
}

/**
 * Encode an ACL parameter to uint256 string
 * @param param ACL Parameter
 * @returns Encoded param
 */
export function encodeParam(param: AclParam): string {
  const encodedParam = new BN(param.id)
    .shln(248)
    .or(new BN(param.op).shln(240))
    .or(parseNumber(param.value))

  return encodedParam.toString()
}

/**
 * Convert an ACL logic parameter from string
 * to an encoded bn.js uint
 * @param str Param string
 * @returns Encoded parameter
 */
function convertStringToLogicParam(str: string): BN {
  try {
    // Remove encodeIfElse, encodeOperator, quotes and spaces
    const cleanStr = str
      .replace(/encodeIfElse/i, '')
      .replace(/encodeOperator/i, '')
      .replace(/^\((.+)\)$/, (m, p1) => p1)
      .replace(/^\[(.+)\]$/, (m, p1) => p1)
      .replace(/ /g, '')
      .replace(/"/g, '')
      .replace(/'/g, '')

    const params = cleanStr.split(',')

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
 * @param param1 Left param
 * @param param2 Right param
 * @returns Encoded operator
 */
function encodeOperator(param1: string, param2: string): BN {
  return new BN(param1).add(new BN(param2).shln(32))
}

/**
 * Encode an if-else condition
 * Original logic: https://github.com/aragon/aragonOS/blob/v4.2.1/contracts/test/helpers/ACLHelper.sol
 * @param condition Condition param
 * @param successParam Success param
 * @param failureParam Failure param
 * @returns Encoded condition
 */
function encodeIfElse(
  condition: string,
  successParam: string,
  failureParam: string
): BN {
  return new BN(condition)
    .add(new BN(successParam).shln(32))
    .add(new BN(failureParam).shln(64))
}

/**
 * Parse a decimal or hexadecimal number
 * @param {string|number} number Number
 * @returns {BN} bn.js number
 */
function parseNumber(number: string | number): BN {
  if (typeof number === 'string') {
    if (number.substr(0, 2) === '0x') {
      return new BN(number.substr(2), 16)
    } else {
      return new BN(number)
    }
  } else {
    return new BN(number)
  }
}
