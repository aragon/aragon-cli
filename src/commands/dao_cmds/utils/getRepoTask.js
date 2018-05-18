const LATEST_VERSION = 'latest'

module.exports = ({ apm, apmRepo, apmRepoVersion }) => {
	return async (ctx) => {
		if (apmRepoVersion == LATEST_VERSION) {
		  	ctx.repo = await apm.getLatestVersion(apmRepo)
		} else {
		  	ctx.repo = await apm.getVersion(apmRepo, apmRepoVersion.split('.'))
		}

		// appId is loaded from artifact.json in IPFS
		if (!ctx.repo.appId) {
		  	throw new Error("Cannot find artifacts in APM repo. Please make sure the package is published and IPFS running.")
		}
	}
}