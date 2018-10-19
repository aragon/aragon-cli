const daoArg = require('../utils/daoArg')
const aclExecHandler = require('./utils/aclExecHandler')

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
exports.command = 'set-manager <dao> <app> <role> <new-manager>'

exports.describe = 'Set the permission manager for a permission (only the current permission manager can do it)'

exports.builder = function (yargs) {
  return daoArg(yargs)
}

exports.handler = async function ({ reporter, dao, app, role, newManager, network, apm }) {
  const method = 'setPermissionManager'
  const params = [newManager, app, role]
  return aclExecHandler(dao, method, params, { reporter, apm, network, role })
}
