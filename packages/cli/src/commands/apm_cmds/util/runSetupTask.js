import TaskList from 'listr'
import { isAddress } from 'web3-utils'
import {
  ZERO_ADDRESS,
  APM_INITIAL_VERSIONS,
  isLocalDaemonRunning,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
  getApmRepo,
  useEnvironment,
} from '@aragon/toolkit'

// helpers
import { compileContracts } from '../../../helpers/truffle-runner'
import listrOpts from '../../../helpers/listr-options'

// cmds
import {
  getPrevAndNextVersion,
  InvalidBump,
} from '../../../lib/apm/getPrevAndNextVersion'
import { task as deployTask } from '../../deploy'

// util
import { runScriptHelper } from '../../../util'

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
export default async function runSetupTask({
  // Globals
  cwd,
  environment,

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
  http,
  silent,
  debug,
}) {
  const { appName } = useEnvironment(environment)

  if (onlyContent) {
    contract = ZERO_ADDRESS
  }

  // Set prepublish to true if --prepublish-script argument is used
  if (process.argv.includes('--prepublish-script')) prepublish = true

  /**
   * Flag for the Deploy contract task
   * @type {boolean}
   */
  let shouldDeployContract

  return new TaskList(
    [
      {
        title: 'Start IPFS',
        skip: async () => isLocalDaemonRunning(),
        task: async () => {
          await startLocalDaemon(getBinaryPath(), getDefaultRepoPath(), {
            detached: false,
          })
        },
      },
      {
        // TODO: During test decide which prepublish script choose here and for building
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
        title: `Applying version bump (${bumpOrVersion})`,
        task: async (ctx, task) => {
          task.output = 'Fetching latest version from aragonPM...'
          try {
            const {
              initialRepo,
              prevVersion,
              version,
              shouldDeployContract: _shouldDeployContract,
            } = await getPrevAndNextVersion(bumpOrVersion, environment)

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
        enabled: () => !onlyContent && isAddress(contract),
        task: async () => compileContracts(),
      },
      {
        title: 'Deploy contract',
        enabled: () =>
          !onlyContent &&
          ((contract && !isAddress(contract)) ||
            (!contract && shouldDeployContract && !reuse)),
        task: async () => {
          return deployTask({
            cwd,
            environment,
            contract,
            init,
          })
        },
      },
      {
        title: 'Determine contract address for version',
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) => {
          if (isAddress(contract)) {
            ctx.contract = contract
            return `Using ${contract}`
          }

          // Get address of deployed contract
          ctx.contract = ctx.contractAddress

          if (!ctx.contract && !APM_INITIAL_VERSIONS.includes(ctx.version)) {
            // Check if we can fall back to a previous contract address
            task.output = 'No contract address provided, using previous one'

            try {
              const { contractAddress } = await getApmRepo(
                appName,
                'latest',
                environment
              )
              ctx.contract = contractAddress
              return `Using ${contractAddress}`
            } catch (err) {
              throw new Error('Could not determine previous contract')
            }
          }

          // Contract address required for initial version
          if (!ctx.contract) {
            throw new Error('No contract address supplied for initial version')
          }

          return `Using ${ctx.contractAddress}`
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}
