const TaskList = require('listr')
const execTask = require('../../dao_cmds/utils/execHandler').task
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')

module.exports = function runPublishTask({
  reporter,

  // Globals
  gasPrice,
  web3,
  wsProvider,
  module,
  apm: apmOptions,
  silent,
  debug,

  // Arguments
  /// Conditionals
  onlyArtifacts,
  onlyContent,

  /// Context
  dao,
  proxyAddress,
  methodName,
  params,
}) {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  return new TaskList(
    [
      {
        title: `Publish ${module.appName}`,
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) =>
          execTask({
            dao,
            app: proxyAddress,
            method: methodName,
            params,
            ipfsCheck: false,
            reporter,
            gasPrice,
            apm: apmOptions,
            web3,
            wsProvider,
          }),
      },
    ],
    listrOpts(silent, debug)
  )
}
