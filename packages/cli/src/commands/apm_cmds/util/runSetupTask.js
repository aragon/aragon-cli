import TaskList from 'listr'
import { isAddress } from 'web3-utils'
import {
  ZERO_ADDRESS,
  isLocalDaemonRunning,
  startLocalDaemon,
  getBinaryPath,
  getDefaultRepoPath,
} from '@aragon/toolkit'

import { runScriptHelper } from '../../../util'

// helpers
import { compileContracts } from '../../../helpers/truffle-runner'
import listrOpts from '../../../helpers/listr-options'
import semver from 'semver'
import APM from '@aragon/apm'

// cmds
import { task as deployTask } from '../../deploy'

const getMajor = version => version.split('.')[0]

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
  bump,

  /// Contract
  contract,
  init,
  reuse,

  /// Conditionals
  onlyContent,
  onlyArtifacts,
  http,
}) {
  if (onlyContent) {
    contract = ZERO_ADDRESS
  }
  const apm = APM(web3, apmOptions)

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
        title: `Applying version bump (${bump})`,
        task: async (ctx, task) => {
          let isValid = true
          try {
            const ipfsTimeout = 1000 * 60 * 5 // 5min

            task.output = 'Fetching latest version from aragonPM...'

            ctx.initialRepo = await apm.getLatestVersion(
              module.appName,
              ipfsTimeout
            )

            ctx.initialVersion = ctx.initialRepo.version

            ctx.version = semver.valid(bump)
              ? semver.valid(bump)
              : semver.inc(ctx.initialVersion, bump)

            isValid = await apm.isValidBump(
              module.appName,
              ctx.initialVersion,
              ctx.version
            )
            if (!isValid) {
              throw new Error(
                "Version bump is not valid, you have to respect APM's versioning policy. Check the version upgrade rules in the documentation: https://hack.aragon.org/docs/apm-ref.html#version-upgrade-rules"
              )
            }

            ctx.shouldDeployContract =
              getMajor(ctx.initialVersion) !== getMajor(ctx.version)
          } catch (e) {
            if (e.message.indexOf('Invalid content URI') === 0) {
              return
            }
            // Repo doesn't exist yet, deploy the first version
            ctx.version = semver.valid(bump)
              ? semver.valid(bump)
              : semver.inc('0.0.0', bump) // All valid initial versions are a version bump from 0.0.0
            if (apm.validInitialVersions.indexOf(ctx.version) === -1) {
              throw new Error(
                `Invalid initial version  (${ctx.version}). It can only be 0.0.1, 0.1.0 or 1.0.0.`
              )
            }
            ctx.shouldDeployContract = true // assume first version should deploy a contract
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
        enabled: ctx =>
          !onlyContent &&
          ((contract && !isAddress(contract)) ||
            (!contract && ctx.shouldDeployContract && !reuse)),
        task: async ctx => {
          const deployTaskParams = {
            module,
            contract,
            init,
            gasPrice,
            network,
            cwd,
            web3,
            apmOptions,
          }
          return deployTask(deployTaskParams)
        },
      },
      {
        title: 'Determine contract address for version',
        enabled: () => !onlyArtifacts,
        task: async (ctx, task) => {
          // Get address of deployed contract
          ctx.contract = ctx.contractAddress
          if (isAddress(contract)) {
            ctx.contract = contract
          }

          // Check if we can fall back to a previous contract address
          if (
            !ctx.contract &&
            apm.validInitialVersions.indexOf(ctx.version) === -1
          ) {
            task.output = 'No contract address provided, using previous one'

            try {
              const { contractAddress } = await apm.getLatestVersion(
                module.appName
              )
              ctx.contract = contractAddress
              return `Using ${ctx.contract}`
            } catch (err) {
              throw new Error('Could not determine previous contract')
            }
          }

          // Contract address required for initial version
          if (!ctx.contract) {
            throw new Error('No contract address supplied for initial version')
          }

          return `Using ${ctx.contract}`
        },
      },
    ],
    listrOpts(silent, debug)
  )
}
