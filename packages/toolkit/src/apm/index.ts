import { AragonApmRepoData, ApmVersion } from './types'
import { useEnvironment } from '../helpers'
import { ethers } from 'ethers'
import { Repo } from './repo'
import { Registry } from './registry'

// Single initializer
export function Apm(
  provider: ethers.providers.Provider,
  options?: { ipfsGateway?: string }
) {
  return {
    ...Repo(provider, options),
    ...Registry(provider),
  }
}

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

  const repo = Repo(provider)
  return repo.getVersionContent(apmRepoName, apmRepoVersion, {
    ipfsGateway: apmOptions.ipfs.gateway,
  })
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

  const repo = Repo(provider)
  return repo.getAllVersions(apmRepoName)
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

  const registry = Registry(provider)
  return registry.getRegistryPackages(apmRegistryName)
}
