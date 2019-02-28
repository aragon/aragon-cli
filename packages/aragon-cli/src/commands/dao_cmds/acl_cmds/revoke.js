const daoArg = require('../utils/daoArg')
const aclExecHandler = require('./utils/aclExecHandler')

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
exports.command = 'revoke <dao> <app> <role> <entity>'

exports.describe = 'Revoke a permission in a DAO'

exports.builder = function(yargs) {
  return daoArg(yargs)
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
}) {
  const method = 'revokePermission'
  const params = [entity, app, role]
  return aclExecHandler(dao, method, params, {
    reporter,
    apm,
    network,
    wsProvider,
    role,
  })
}
