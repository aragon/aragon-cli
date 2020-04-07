import daoArg from '../utils/daoArg'
import aclExecHandler from './utils/aclExecHandler'

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
export const command = 'set-manager <dao> <app> <role> <new-manager>'

export const describe =
  'Set the permission manager for a permission (only the current permission manager can do it)'

export const builder = function (yargs) {
  return daoArg(yargs)
}

export const handler = async function ({
  reporter,
  dao,
  app,
  role,
  newManager,
  network,
  wsProvider,
  apm,
  gasPrice,
}) {
  const method = 'setPermissionManager'
  const params = [newManager, app, role]
  return aclExecHandler(dao, method, params, {
    reporter,
    gasPrice,
    apm,
    network,
    wsProvider,
    role,
  })
}
