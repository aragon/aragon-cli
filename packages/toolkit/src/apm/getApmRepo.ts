import { ethers } from 'ethers'
import { repoAbi } from '../contractAbis'
import {
  parseApmVersionReturn,
  toApmVersionArray,
  linspace,
  getFetchUrlFromContentUri,
  fetchJson,
} from './utils'
import {
  ApmVersion,
  ApmVersionReturn,
  ApmRepoInstance,
  AragonApmRepoData,
} from './types'
import { AragonManifest, AragonArtifact } from '../types'

/**
 * Internal logic shared with single and all version fetchers
 * @param repo Initialized ethers APM Repo contract
 * @param version Version to fetch: 'latest', '0.2.0', 14
 */
async function _getApmRepoVersion(
  repo: ApmRepoInstance,
  version: string | number
): Promise<ApmVersion> {
  const res: ApmVersionReturn =
    typeof version === 'number'
      ? await repo.getByVersionId(version)
      : version === 'latest'
      ? await repo.getLatest()
      : await repo.getBySemanticVersion(toApmVersionArray(version))
  return parseApmVersionReturn(res)
}

/**
 * Fetch a single version of an APM Repo
 * @param appId 'finance.aragonpm.eth'
 * @param version Version to fetch: 'latest', '0.2.0', 14
 * @param provider Initialized ethers provider
 */
export async function getApmRepoVersion(
  appId: string,
  version: string | number,
  provider: ethers.utils.types.MinimalProvider
): Promise<ApmVersion> {
  const repo = new ethers.Contract(appId, repoAbi, provider) as ApmRepoInstance
  return _getApmRepoVersion(repo, version)
}

/**
 * Fetch all versions of an APM Repo
 * @param appId 'finance.aragonpm.eth'
 * @param provider Initialized ethers provider
 */
export async function getApmRepoAllVersions(
  appId: string,
  provider: ethers.utils.types.MinimalProvider
): Promise<ApmVersion[]> {
  const repo = new ethers.Contract(appId, repoAbi, provider) as ApmRepoInstance
  const versionCount: number = await repo.getVersionsCount().then(parseFloat)
  const versionIdxs = linspace(1, versionCount)
  return Promise.all(versionIdxs.map(async i => _getApmRepoVersion(repo, i)))
}

/**
 * Fetch a single version of an APM Repo and resolve its contents
 * @param appId 'finance.aragonpm.eth'
 * @param version Version to fetch: 'latest', '0.2.0', 14
 * @param provider Initialized ethers provider
 * @param options additional options to process version data
 * @param options.ipfsGateway 'http://localhost:8080' | 'https://my-remote-ipfs.io'
 */
export async function getApmRepo(
  appId: string,
  version: 'latest' | string | number,
  provider: ethers.utils.types.MinimalProvider,
  options?: { ipfsGateway: string }
): Promise<AragonApmRepoData> {
  const versionInfo = await getApmRepoVersion(appId, version, provider)

  const url = getFetchUrlFromContentUri(versionInfo.contentUri, options)
  const [manifest, artifact] = await Promise.all([
    fetchJson<AragonManifest>(`${url}/manifest.json`),
    fetchJson<AragonArtifact>(`${url}/artifact.json`),
  ])

  return {
    ...versionInfo,
    ...manifest,
    ...artifact,
  }
}
