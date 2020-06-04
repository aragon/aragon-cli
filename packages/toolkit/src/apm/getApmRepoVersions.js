import APM from '@aragon/apm'
import { DEFAULT_IPFS_TIMEOUT } from '../helpers/constants'

export default async (web3, apmRepoName, apmOptions) => {
  // Prepare APM object that can comunicate with the apm contracts.
  const apm = await APM(web3, apmOptions)

  // Query all versions for this repo.
  const versions = await apm.getAllVersions(apmRepoName, DEFAULT_IPFS_TIMEOUT)

  return versions
}
