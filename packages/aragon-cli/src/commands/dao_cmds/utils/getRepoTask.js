const LATEST_VERSION = 'latest'

module.exports = {
  args: yargs => {
    return yargs
      .option('apmRepo', {
        describe: 'Name of the APM repo',
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
        ctx.repo = await apm.getLatestVersion(apmRepo)
      } else {
        ctx.repo = await apm.getVersion(apmRepo, apmRepoVersion.split('.'))
      }

      // appId is loaded from artifact.json in IPFS
      if (artifactRequired && !ctx.repo.appId) {
        throw new Error(
          'Cannot find artifacts in APM repo. Please make sure the package is published and IPFS or your HTTP server running.'
        )
      }
    }
  },
}
