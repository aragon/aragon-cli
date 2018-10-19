const daoArg = require('../utils/daoArg')
const aclExecHandler = require('./utils/aclExecHandler')

// Note: we usually order these values as entity, proxy, role but this order fits
//       better with other CLI commands
exports.command = 'create <dao> <app> <role> <entity> <manager>'

exports.describe = 'Create a permission in a DAO (only usable for permissions that haven\'t been set)'

exports.builder = function (yargs) {
  return daoArg(yargs)
}

exports.handler = async function ({ reporter, network, apm, dao, app, role, entity, manager }) {
  const method = 'createPermission'
  const params = [entity, app, role, manager]
  return aclExecHandler(dao, method, params, { reporter, apm, network, role })
}
