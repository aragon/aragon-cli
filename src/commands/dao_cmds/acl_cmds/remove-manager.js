const daoArg = require('../utils/daoArg')
const aclExecHandler = require('./utils/aclExecHandler')

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
exports.command = 'remove-manager <dao> <app> <role>'

exports.describe =
  'Remove permission manager for a permission (can be recreated)'

exports.builder = function(yargs) {
  return daoArg(yargs)
}

exports.handler = async function({
  reporter,
  dao,
  app,
  role,
  network,
  wsProvider,
  apm,
}) {
  const method = 'removePermissionManager'
  const params = [app, role]
  return aclExecHandler(dao, method, params, {
    reporter,
    apm,
    network,
    wsProvider,
    role,
  })
}
