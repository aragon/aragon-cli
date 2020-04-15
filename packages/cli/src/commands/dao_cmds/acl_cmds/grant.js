import { convertStringToParam, encodeParam } from '@aragon/toolkit'
//
import daoArg from '../utils/daoArg'
import aclExecHandler from './utils/aclExecHandler'

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
export const command = 'grant <dao> <app> <role> <entity> [params...]'

export const describe =
  'Grant a permission in a DAO (only permission manager can do it)'

export const builder = function (yargs) {
  return daoArg(yargs).positional('params', {
    description: 'ACL parameters',
    default: [],
  })
}

export const handler = async function ({
  reporter,
  dao,
  app,
  role,
  entity,
  network,
  wsProvider,
  apm,
  gasPrice,
  params,
}) {
  const method = params.length === 0 ? 'grantPermission' : 'grantPermissionP'

  const methodParams =
    params.length === 0
      ? [entity, app, role]
      : [entity, app, role, params.map(convertStringToParam).map(encodeParam)]

  return aclExecHandler(dao, method, methodParams, {
    reporter,
    gasPrice,
    apm,
    network,
    wsProvider,
    role,
  })
}
