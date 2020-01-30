import daoArg from '../utils/daoArg'
import aclExecHandler from './utils/aclExecHandler'

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
export const command = 'remove-manager <dao> <app> <role>'

export const describe =
  'Remove permission manager for a permission (can be recreated)'

export const builder = function(yargs) {
  return daoArg(yargs)
}

export const handler = async function({
  reporter,
  environment,
  dao,
  app,
  role,
}) {
  const method = 'removePermissionManager'
  const params = [app, role]
  return aclExecHandler(dao, method, params, {
    reporter,
    environment,
    role,
  })
}
