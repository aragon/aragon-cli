const BN = require('bn.js')

const Op = { 
    NONE: 0,
    EQ: 1,
    NEQ: 2,
    GT: 3,
    LT: 4,
    GTE: 5,
    LTE: 6,
    RET: 7,
    NOT: 8,
    AND: 9,
    OR: 10,
    XOR: 11,
    IF_ELSE: 12
  }
  
  function convertStringToParam(str) {
    try {
      str = str
        .replace(/^\[(.+)\]$/, (m, p1) => p1)
        .replace(/ /g, '')
        .replace(/\"/g, '')
        .replace(/\'/g, '')
  
      let [id, op, value] = str.split(',')
  
      if (Number.isInteger(Op[op]))
        op = Op[op]
  
      if (value.substr(0, 2) === '0x')
        value = new BN(value.substr(2), 16)
  
      return { id, op, value }
    } catch(err) {
      throw new Error(`Can't parse param ${str}`)
    }
     
  }
  
  /**
   * 
   * @param {Param} param 
   */
  function encodeParam(param) {
    const encodedParam = new BN(param.id).shln(248)
      .or(new BN(param.op).shln(240))
      .or(new BN(param.value))
  
    return encodedParam.toString()
  }

  module.exports = { encodeParam, convertStringToParam, Op }