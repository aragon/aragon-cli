import { DEFAULT_IPFS_TIMEOUT } from '@aragon/toolkit/dist/helpers/constants'
//
const LATEST_VERSION = 'latest'

module.exports = {
  args: yargs => {
    return yargs
      .option('apmRepo', {
        describe: 'Name of the aragonPM repo',
      })
      .option('apmRepoVersion', {
        describe: 'Version of the package upgrading to',
        default: 'latest',
      })
  },
  task: ({
    apm,
    apmRepo,
    apmRepoVersion = LATEST_VERSION,
    artifactRequired = true,
  }) => {
    return async ctx => {
      if (apmRepoVersion === LATEST_VERSION) {
        ctx.repo = await apm.getLatestVersion(apmRepo, DEFAULT_IPFS_TIMEOUT)
      } else {
        ctx.repo = await apm.getVersion(
          apmRepo,
          apmRepoVersion.split('.'),
          DEFAULT_IPFS_TIMEOUT
        )
      }

      // appId is loaded from artifact.json in IPFS
      if (artifactRequired && !ctx.repo.appId) {
        // TODO: load ipfs aragon node and fetch repo again. If this time we have the artifact then return otherwise throw Error.

        throw new Error(
          'Cannot find artifacts in aragonPM repo. Please make sure the package is published and IPFS or your HTTP server running.'
        )
      }
    }
  },
}
