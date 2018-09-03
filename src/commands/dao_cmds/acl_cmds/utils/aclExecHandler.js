const execHandler = require('../../utils/execHandler')

module.exports = async function (dao, method, params, { reporter, apm, network }) {
  const getTransactionPath = (wrapper) => (
    wrapper.getACLTransactionPath(method, params)
  )
  return execHandler(dao, getTransactionPath, { reporter, apm, network })
}
