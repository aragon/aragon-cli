import daoArg from '../utils/daoArg'
import aclExecHandler from './utils/aclExecHandler'

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
export const command = 'revoke <dao> <app> <role> <entity>'

export const describe = 'Revoke a permission in a DAO'

export const builder = function(yargs) {
  return daoArg(yargs)
}

export const handler = async function({
  reporter,
  dao,
  app,
  role,
  entity,
  network,
  wsProvider,
  apm,
  gasPrice,
}) {
  const method = 'revokePermission'
  const params = [entity, app, role]
  return aclExecHandler(dao, method, params, {
    reporter,
    gasPrice,
    apm,
    network,
    wsProvider,
    role,
  })
}
