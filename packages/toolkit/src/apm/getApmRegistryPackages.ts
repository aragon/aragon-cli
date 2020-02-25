import { ethers } from 'ethers'
import { getApmRepoVersion } from './getApmRepo'

const registryNewRepoEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: false, name: 'id', type: 'bytes32' },
    { indexed: false, name: 'name', type: 'string' },
    { indexed: false, name: 'repo', type: 'address' },
  ],
  name: 'NewRepo',
  type: 'event',
}

interface NewRepoEventValues {
  id: string
  name: string
  repo: string
}

interface NewRepoEvent {
  blockNumber: number
  returnValues: NewRepoEventValues
}

/**
 * Fetches the new repos logs from a registry
 * This is slightly verbose than web3 but it's the required way
 *
 * Note: Will throw with "ENS name not configured" if the
 * registry ENS name can't be resolved
 * @param apmRegistryName APM registry name
 * @param provider Initialized ethers provider
 * @param fromBlock Optional to speed up fetching on non-cached nodes: 9011233
 */
export async function getNewReposFromRegistry(
  apmRegistryName: string,
  provider: ethers.providers.Provider,
  fromBlock?: number
): Promise<NewRepoEvent[]> {
  const newRepoEvent = new ethers.utils.Interface([registryNewRepoEventAbi])

  const newRepoEventTopic =
    newRepoEvent.events[registryNewRepoEventAbi.name].topic

  const result = await provider.getLogs({
    address: apmRegistryName, // or contractEnsName,
    fromBlock: fromBlock || 0,
    toBlock: 'latest',
    topics: [newRepoEventTopic],
  })

  return result.map(event => {
    const parsedLog = newRepoEvent.parseLog(event)
    if (!parsedLog || !parsedLog.values)
      throw Error(`Error parsing NewRepo event`)
    // Cast the type of values, because parsedLog.values is any[]
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { id, name, repo }: NewRepoEventValues = parsedLog.values as any
    return {
      blockNumber: event.blockNumber || 0,
      returnValues: { id, name, repo },
    }
  })
}

/**
 * Return package info for a given APM registry.
 * @param apmRegistryName APM registry name
 * @param provider Initialized ethers provider
 */
export async function getApmRegistryPackages(
  apmRegistryName: string,
  provider: ethers.providers.Provider
): Promise<{ name: string; version: string }[]> {
  const newRepoEvents = await getNewReposFromRegistry(apmRegistryName, provider)

  return Promise.all(
    newRepoEvents.map(async event => {
      const { name } = event.returnValues
      try {
        const versionInfo = await getApmRepoVersion(
          `${name}.${apmRegistryName}`,
          'latest',
          provider
        )
        return { name, version: versionInfo.version }
      } catch (e) {
        // A new repo that has 0 versions will revert when calling getLatest()
        if (e.message.includes('REPO_INEXISTENT_VERSION')) {
          return { name, version: '' }
        } else {
          throw e
        }
      }
    })
  )
}
