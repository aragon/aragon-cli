import * as parser from 'solidity-parser-antlr'

interface AragonFunction {
  name: string
  paramTypes: string[]
  roles: { name: string; paramCount: number }[]
}

/**
 * Parses relevant function and roles information from a contract's solidity
 * source code. Returns:
 * - All external / public state modifying functions and their roles
 * - Guesses the param count of the roles, if a normal syntax if used
 *
 * Roles are expected to be used with these two modifiers exclusively
 * - modifier auth(bytes32 _role)
 * - modifier authP(bytes32 _role, uint256[] _params)
 *
 * @param sourceCode Solidity flatten source code
 */
export default function parseFunctions(sourceCode: string): AragonFunction[] {
  const ast = parser.parse(sourceCode, {})

  const functions: AragonFunction[] = []
  parser.visit(ast, {
    // Visit all function declarations
    FunctionDefinition: node => {
      // Process only public and state modyfing functions
      if (
        node.visibility === 'internal' ||
        node.visibility === 'private' ||
        node.stateMutability === 'view' ||
        node.stateMutability === 'pure' ||
        node.stateMutability === 'constant'
      )
        return

      // Check the modifiers
      const authMods = node.modifiers.filter(
        modNode => modNode.name === 'auth' || modNode.name === 'authP'
      )

      // Parse parameters for signature, some functions may be overloaded
      const paramTypes = node.parameters.map(paramNode =>
        paramNode.typeName.type === 'ElementaryTypeName'
          ? paramNode.typeName.name
          : null
      )

      functions.push({
        name: node.name,
        paramTypes: paramTypes,
        roles: authMods.map(parseRoleFromNode),
      })
    },
  })

  return functions
}

/**
 * Helper to parse relevant role information from a modifier node
 * @param node
 */
function parseRoleFromNode(
  node: parser.ModifierInvocation
): { name: string; paramCount: number } {
  return {
    name: parseRoleNameFromNode(node),
    paramCount: parseRoleParamCountFromNode(node),
  }
}

/**
 * Helper to parse the role name from a modifier node
 * Using an isolated function to use a switch / return structure
 * @param node
 */
function parseRoleNameFromNode(node: parser.ModifierInvocation): string {
  const [roleIdArg] = node.arguments
  switch (roleIdArg.type) {
    case 'Identifier':
      // Common usage with a pre-defined variable
      // CREATE_PAYMENTS_ROLE = keccak256('CREATE_PAYMENTS_ROLE');
      // auth(CREATE_PAYMENTS_ROLE);
      return roleIdArg.name
    default:
      // Unknown parsing state
      return ''
  }
}

/**
 * Helper to parse the role param count from a modifier node
 * Using an isolated function to use a switch / return structure
 * @param node
 */
function parseRoleParamCountFromNode(node: parser.ModifierInvocation): number {
  const [, paramsArg] = node.arguments
  if (!paramsArg) return 0
  if (
    paramsArg.type === 'FunctionCall' &&
    paramsArg.expression.type === 'Identifier' &&
    paramsArg.expression.name === 'arr'
  )
    return paramsArg.arguments.length

  // Unknown parsing state
  return 0
}
