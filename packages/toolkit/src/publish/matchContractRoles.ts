import { flatten, uniqBy } from 'lodash'
import { AragonContractFunction } from '../solidityParsers/parseContractFunctions'
import { Role } from './types'

interface RoleMatchError {
  id: string
  message: string
}

export default function matchContractRoles(
  functions: AragonContractFunction[],
  roles: Role[]
): RoleMatchError[] {
  const errors: RoleMatchError[] = []
  const addError = (id: string, message: string) => errors.push({ id, message })

  const contractRoles = uniqBy(
    flatten(functions.map(fn => fn.roles)),
    role => role.id
  )

  for (const role of roles) {
    const paramCount = (role.params || []).length
    const contractRole = contractRoles.find(({ id }) => id === role.id)
    if (!contractRole) addError(role.id, 'Role not used in contract')
    else if (paramCount !== contractRole.paramCount)
      addError(
        role.id,
        `Role has ${paramCount} declared params but contract uses ${contractRole.paramCount}`
      )
  }

  for (const contractRole of contractRoles) {
    const role = roles.find(({ id }) => id === contractRole.id)
    if (!role) addError(role.id, 'Role not declared in arapp')
  }

  return errors
}
