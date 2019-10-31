const { flattenDeep } = require('lodash')

/**
 * @typedef {Object} Modifier
 * @property {string} name         - Role name "CREATE_REPO_ROLE"
 * @property {string[]} params     - ['_arg1', 'arg2']
 * @property {string} functionName - function in which this role is used
 */

/**
 * Parses the AST to fetch info about auth and authP modifiers
 * modifier auth(bytes32 _role)
 * modifier authP(bytes32 _role, uint256[] _params)
 * @param  {string} buildArtifactPath
 *         relative path to the artifact
 * @return {Modifier[]}
 *         parsedModifiers
 */
const extractRoles = buildArtifactPath => {
  const parsedModifiers = []

  const { ast } = require(buildArtifactPath)
  const contracts = ast.nodes.filter(
    ({ nodeType }) => nodeType === 'ContractDefinition'
  )
  for (const contract of contracts) {
    const functions = contract.nodes.filter(
      fn =>
        fn.nodeType === 'FunctionDefinition' &&
        fn.modifiers &&
        fn.modifiers.length
    )
    for (const fn of functions) {
      const modifiers = fn.modifiers.filter(modifier => {
        const name = modifier.modifierName.name
        return name === 'auth' || name === 'authP'
      })
      for (const modifier of modifiers) {
        const [roleArg, paramsArg] = modifier.arguments
        parsedModifiers.push({
          name: parseRoleName(roleArg),
          params: paramsArg ? parseParamsArg(paramsArg) : [],
          functionName: fn.name,
        })
      }
    }
  }

  return parsedModifiers
}

/**
 * Parses the first argument of a auth | authP function to get the role name
 * @param  {SolidityAstNode} node
 *         AST node
 * @return {string}
 *         Role name: 'CREATE_REPO_ROLE'
 */
function parseRoleName(node) {
  if (node.nodeType === 'Identifier' && node.name) return node.name
  return ''
}

/**
 * Tries to figure out most relevant human name of a given node
 * @param  {SolidityAstNode} node
 *         AST node
 * @return {string}
 *         Guessed arg name: '_amount' | '0' | 'getTimestamp()'
 */
function resolveNodeName(node) {
  const nodeType = node.nodeType

  if (nodeType === 'FunctionCall') {
    // For functions of no parameters, return the function name
    if (!node.arguments || !node.arguments.length)
      return node.expression.name + '()'

    // For functions of 1 parameter, try to parse it
    if (node.arguments.length === 1) {
      const subArg = resolveNodeName(node.arguments[0])
      if (subArg) return subArg
    }

    if (node.expression.name) return node.expression.name + '()'
    return node.expression.name + '()'
  }

  // For regular variables, return name and type
  if (nodeType === 'Identifier') return node.name
  if (nodeType === 'Literal') return String(node.value)
  if (nodeType === 'MemberAccess') return node.memberName
  if (nodeType === 'IndexAccess') return resolveNodeName(node.baseExpression)
  if (nodeType === 'Conditional') return 'flag'
  if (nodeType === 'UnaryOperation') return resolveNodeName(node.subExpression)
  if (nodeType === 'BinaryOperation') return 'condition'

  return node.name || ''
}

/**
 * Resolves the argument count and names recursively
 * [NOTE]: Since this function is called recursively, it may
 * return nested arrays [[['arg1', 'arg2']]], so it's flattenDeep
 * @param  {SolidityAstNode} node
 *         AST node
 * @return {string[]}
 *         Arg names: ['_arg1', 'arg2']
 */
function parseParamsArg(node) {
  const returnType = node.typeDescriptions.typeString

  if (returnType === 'uint256[]' || returnType === 'uint256[] memory')
    return flattenDeep(node.arguments.map(parseParamsArg))

  return resolveNodeName(node)
}

module.exports = {
  extractRoles,
}
