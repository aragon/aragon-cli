import daoArg from '../utils/daoArg'
import aclExecHandler from './utils/aclExecHandler'

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
export const command = 'create <dao> <app> <role> <entity> <manager>'

export const describe =
  "Create a permission in a DAO (only usable for permissions that haven't been set)"

export const builder = function(yargs) {
  return daoArg(yargs)
}

export const handler = async function({
  reporter,
  environment,
  dao,
  app,
  role,
  entity,
  manager,
  silent,
  debug,
}) {
  const method = 'createPermission'
  const params = [entity, app, role, manager]
  return aclExecHandler(dao, method, params, {
    reporter,
    environment,
    role,
    silent,
    debug,
  })
}
