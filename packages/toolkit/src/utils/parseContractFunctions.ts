import * as parser from 'solidity-parser-antlr'
import path from 'path'

export interface AragonContractFunction {
  name: string
  notice: string
  paramTypes: string[]
  roles: { id: string; paramCount: number }[]
}

/**
 * Helper to parse the role name from a modifier node
 * Using an isolated function to use a switch / return structure
 * @param node
 * @return "CREATE_PAYMENTS_ROLE"
 */
function parseRoleIdFromNode(node: parser.ModifierInvocation): string {
  const [roleIdArg] = node.arguments || []
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
function parseRoleParamCountFromNode(
  node: parser.ModifierInvocation,
  authHelperFunctions: Set<string>
): number {
  const [, paramsArg] = node.arguments || []
  if (!paramsArg) return 0
  if (
    paramsArg.type === 'FunctionCall' &&
    paramsArg.expression.type === 'Identifier' &&
    authHelperFunctions.has(paramsArg.expression.name)
  ) {
    // Argument is an valid auth helper function that returns uint256[]
    // so its arguments can be considered for the role param count
    return paramsArg.arguments.length
  }

  // Unknown parsing state
  return 0
}

/**
 * Helper to parse the paramType of an argument to guess the signature
 * Using an isolated function to use a switch / return structure
 * @param node
 */
function parseParamTypeFromNode(node: parser.VariableDeclaration): string {
  switch (node.typeName.type) {
    case 'ElementaryTypeName':
      return node.typeName.name
    case 'ArrayTypeName':
      // eslint-disable-next-line no-case-declarations
      const { baseTypeName, length } = node.typeName
      if (
        baseTypeName.type === 'ElementaryTypeName' &&
        length &&
        length.type === 'NumberLiteral'
      ) {
        return `${baseTypeName.name}[${length.number}]`
      } else {
        return null
      }
    case 'UserDefinedTypeName':
      return 'address'
  }
  return 'address'
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
 * @param targetContract "Counter" | "contract/Counter.sol"
 */
export default function parseContractFunctions(
  sourceCode: string,
  targetContract: string
): AragonContractFunction[] {
  const targetContractName = path.parse(targetContract).name
  const ast = parser.parse(sourceCode, {})
  const functions: AragonContractFunction[] = []
  const authHelperFunctions: Set<string> = new Set()
  const parsedContract: Set<string> = new Set()

  // Aggregate valid auth helper functions first to help count
  // the role params in a safer and more flexible way
  parser.visit(ast, {
    FunctionDefinition: node => {
      if (
        node.visibility === 'internal' &&
        node.stateMutability === 'pure' &&
        node.returnParameters &&
        node.returnParameters.length === 1
      ) {
        const returnParam = node.returnParameters[0]
        if (
          returnParam.typeName.type === 'ArrayTypeName' &&
          returnParam.typeName.baseTypeName.type === 'ElementaryTypeName' &&
          returnParam.typeName.baseTypeName.name === 'uint256'
        )
          authHelperFunctions.add(node.name)
      }
    },
  })

  // Parse contract definitions in the first ast node which should be a SourceUnit
  if (ast.type !== 'SourceUnit')
    throw Error('First block is not of expected type SourceUnit')
  // Aggregate all contracts for recursively parsing bases below
  const contracts: parser.ContractDefinition[] = ast.children.filter(
    node => node.type === 'ContractDefinition' && node.kind === 'contract'
  ) as any

  function parseContract(node: parser.ContractDefinition) {
    // Parse functions
    for (const subNode of node.subNodes) {
      if (
        subNode.type === 'FunctionDefinition' &&
        // Ignore constructors
        !subNode.isConstructor &&
        // Only consider functions that modify state and are public / external
        subNode.visibility !== 'internal' &&
        subNode.visibility !== 'private' &&
        subNode.stateMutability !== 'view' &&
        subNode.stateMutability !== 'pure' &&
        subNode.stateMutability !== 'constant' &&
        // Ignore the initialize function
        subNode.name !== 'initialize'
      ) {
        // Check the modifiers
        functions.push({
          name: subNode.name,
          notice: '',
          // Parse parameters for signature, some functions may be overloaded
          paramTypes: subNode.parameters.map(parseParamTypeFromNode),
          // Parse the auth modifiers
          roles: subNode.modifiers
            .filter(modNode => ['auth', 'authP'].includes(modNode.name))
            .map(authModNode => ({
              id: parseRoleIdFromNode(authModNode),
              paramCount: parseRoleParamCountFromNode(
                authModNode,
                authHelperFunctions
              ),
            })),
        })
      }
    }

    // Parse base contracts
    for (const baseContract of node.baseContracts) {
      const baseName = baseContract.baseName.namePath
      // Protect against infinite loops with a Set
      if (baseName && !parsedContract.has(baseName)) {
        parsedContract.add(node.name)
        const contract = contracts.find(node => node.name === baseName)
        if (contract) parseContract(contract)
      }
    }
  }

  // Start the parsing from the target contract find by "contractName"
  // or if not found, start with the last contract which in
  // flatten source should be the target contract
  parseContract(
    (targetContractName &&
      contracts.find(node => node.name === targetContractName)) ||
      contracts[contracts.length - 1]
  )

  return functions
}
