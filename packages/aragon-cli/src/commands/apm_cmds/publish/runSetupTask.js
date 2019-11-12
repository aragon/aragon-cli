const APM = require('@aragon/apm')
const TaskList = require('listr')
const { runScriptHelper, ZERO_ADDRESS } = require('../../../util')
const { compileContracts } = require('../../../helpers/truffle-runner')
const web3Utils = require('web3').utils
const deploy = require('../../deploy')
const startIPFS = require('../../ipfs_cmds/start')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const {
  getPrevAndNextVersion,
  InvalidBump,
} = require('../../../lib/apm/getPrevAndNextVersion')

/**
 * @typedef {Object} VersionAppInfo
 * @property {string} contractAddress "0xaabb1122"
 * @property {string} version "0.2.4"
 * // FUN! may include:
 * { error, contentURI }
 * or
 * { manifest, module, { content: { provider, location } }
 * or
 * { content: { provider, location } }
 *
 * // Where: if contentURI = "ipfs:Qmazz"
 * - provider: "ipfs"
 * - location: "Qmazz"
 */

/**
 * ctx mandatory output:
 * - initialRepo {VersionAppInfo}
 * - initialVersion {string} Version before release: "0.2.4"
 * - version {string} To release version: "0.2.5"
 * @return {TaskList} Tasks
 */
module.exports = function runSetupTask({
  // Globals
  gasPrice,
  cwd,
  web3,
  network,
  module,
  apm: apmOptions,
  silent,
  debug,

  // Arguments

  /// Scritps
  prepublish,
  prepublishScript,
  build,
  buildScript,

  /// Version
  bump: bumpOrVersion,

  /// Contract
  contract,
  init,
  reuse,

  /// Conditionals
  onlyContent,
  onlyArtifacts,
  ipfsCheck,
  http,
}) {
  if (onlyContent) {
    contract = ZERO_ADDRESS
  }
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)

  const appName = module.appName
  /**
   * Flag for the Deploy contract task
   * @type {boolean}
   */
  let shouldDeployContract

  return new TaskList(
    [
      {
        title: 'Running prepublish script',
        enabled: () => prepublish,
        task: async (_0, task) => {
          const abortReason = await runScriptHelper(prepublishScript, log => {
            task.output = log
          })
          if (abortReason) task.skip(abortReason)
        },
      },
      {
        title: 'Check IPFS',
        enabled: () => !http && ipfsCheck,
        task: () => startIPFS.task({ apmOptions }),
      },
      {
        title: `Applying version bump (${bumpOrVersion})`,
        task: async (ctx, task) => {
          task.output = 'Fetching latest version from aragonPM...'
          try {
            const {
              initialRepo,
              prevVersion,
              version,
              shouldDeployContract: _shouldDeployContract,
            } = await getPrevAndNextVersion(appName, bumpOrVersion, apm)

            // (TODO): For now MUST be exposed in the context because their are used around
            ctx.initialRepo = initialRepo
            ctx.initialVersion = prevVersion
            ctx.version = version
            shouldDeployContract = _shouldDeployContract
          } catch (e) {
            if (e instanceof InvalidBump)
              throw Error(
                "Version bump is not valid, you have to respect APM's versioning policy.\nCheck the version upgrade rules in the documentation:\n  https://hack.aragon.org/docs/apm-ref.html#version-upgrade-rules"
              )
          }
        },
      },
      {
        title: 'Building frontend',
        enabled: () => build && !http,
        task: async (_0, task) => {
          const abortReason = await runScriptHelper(buildScript, log => {
            task.output = log
          })
          if (abortReason) task.skip(abortReason)
        },
      },
      {
        title: 'Compile contracts',
        enabled: () => !onlyContent && web3Utils.isAddress(contract),
        task: async () => compileContracts(),
      },
      {
        title: 'Deploy contract',
        enabled: () =>
          !onlyContent &&
          ((contract && !web3Utils.isAddress(contract)) ||
            (!contract && shouldDeployContract && !reuse)),
        task: async () => {
          return deploy.task({
            module,
            contract,
            init,
            gasPrice,
            network,
            cwd,
            web3,
            apmOptions,
          })
        },
      },
      {
        title: 'Determine contract address for version',
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) => {
          if (web3Utils.isAddress(contract)) return `Using ${contract}`

          if (apm.validInitialVersions.includes(ctx.version)) {
            // Contract address required for initial version
            throw new Error('No contract address supplied for initial version')
          } else {
            // Check if we can fall back to a previous contract address
            task.output = 'No contract address provided, using previous one'

            try {
              const { contractAddress } = await apm.getLatestVersion(appName)
              ctx.contract = contractAddress
              return `Using ${contractAddress}`
            } catch (err) {
              throw new Error('Could not determine previous contract')
            }
          }
        },
      },
    ],
    listrOpts(silent, debug)
  )
}
