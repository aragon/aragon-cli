import { AragonApmRepoData, ApmVersion } from './types'
import { useEnvironment } from '../helpers'
import { getDefaultApmName } from './utils'
import {
  getApmRepo as getApmRepoNew,
  getApmRepoAllVersions as getAllVersionsNew,
} from './getApmRepo'
import { getApmRegistryPackages as getApmRegistryPackagesNew } from './getApmRegistryPackages'

export * from './publishVersion'

// ### Note:
// This file is a temporary wrapper to the new apm methods API
// with the previous API, which used the `environment` string

/**
 * Return a Repo object from aragonPM
 * @param apmRepoName APM repo name
 * @param apmRepoVersion APM repo version
 * @param  environment Envrionment
 * @returns  Repo
 */
export async function getApmRepo(
  apmRepoName: string,
  apmRepoVersion = 'latest',
  environment: string
): Promise<AragonApmRepoData> {
  const { apmOptions, provider } = useEnvironment(environment)

  return getApmRepoNew(
    getDefaultApmName(apmRepoName),
    apmRepoVersion,
    provider,
    { ipfsGateway: apmOptions.ipfs.gateway }
  )
}

/**
 * Return all versions of an APM Repo
 * @param apmRepoName APM repo name
 * @param  environment Envrionment
 * @returns  Repo
 */
export async function getAllVersions(
  apmRepoName: string,
  environment: string
): Promise<ApmVersion[]> {
  const { provider } = useEnvironment(environment)

  return getAllVersionsNew(getDefaultApmName(apmRepoName), provider)
}

/**
 * Return packages for a given APM registry.
 * @param apmRegistryName APM registry name
 * @param progressHandler Progress handler
 * @param environment Envrionment
 * @returns
 */
export async function getApmRegistryPackages(
  apmRegistryName: string,
  progressHandler: (progressId: number) => void | undefined,
  environment: string
): Promise<{ name: string; version: string }[]> {
  const { provider } = useEnvironment(environment)

  if (progressHandler) progressHandler(1)
  if (progressHandler) progressHandler(2)

  return getApmRegistryPackagesNew(apmRegistryName, provider)
}
