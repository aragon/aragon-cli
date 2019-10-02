const daoArg = require('../utils/daoArg')
const aclExecHandler = require('./utils/aclExecHandler')
const { convertStringToParam, encodeParam } = require('./utils/params')
const { isArray } = require('lodash')

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
exports.command = 'grant <dao> <app> <role> <entity> [params]'

exports.describe =
  'Grant a permission in a DAO (only permission manager can do it)'

exports.builder = function(yargs) {
  return daoArg(yargs)
    .option('params', {
      description: 'Parameters',
      type: 'array',
      default: [],
      coerce: params => isArray(params) ? params : [params]
    })
}

exports.handler = async function({
  reporter,
  dao,
  app,
  role,
  entity,
  network,
  wsProvider,
  apm,
  gasPrice,
  params
}) {
  const method = params.length === 0
    ? 'grantPermission'
    : 'grantPermissionP'

  const methodParams = params.length === 0 
    ? [entity, app, role]
    : [entity, app, role, params.map(convertStringToParam).map(encodeParam)]

  return aclExecHandler(dao, method, methodParams, {
    reporter,
    gasPrice,
    apm,
    network,
    wsProvider,
    role
  })
}



