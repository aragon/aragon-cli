import { ethers } from 'ethers'
import { repoAbi } from '../contractAbis'
import {
  parseApmVersionReturn,
  toApmVersionArray,
  linspace,
  getFetchUrlFromContentUri,
  fetchJson,
  getDefaultApmName,
} from './utils'
import {
  ApmVersion,
  ApmVersionReturn,
  ApmRepoInstance,
  AragonApmRepoData,
} from './types'
import { AragonManifest, AragonArtifact } from '../types'
import { defaultIpfsGateway } from '../params'

/**
 * Internal logic shared with single and all version fetchers
 * @param repo Initialized ethers APM Repo contract
 * @param version Version to fetch: 'latest', '0.2.0', 14
 */
async function _getRepoVersion(
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

export function Repo(
  provider: ethers.providers.Provider,
  optionsGlobal?: { ipfsGateway?: string }
) {
  return {
    /**
     * Fetch a single version of an APM Repo
     * @param appId 'finance.aragonpm.eth'
     * @param version Version to fetch: 'latest', '0.2.0', 14
     * @param provider Initialized ethers provider
     */
    getVersion: async function(
      appId: string,
      version: string | number
    ): Promise<ApmVersion> {
      const repo = new ethers.Contract(
        appId,
        repoAbi,
        provider
      ) as ApmRepoInstance
      return _getRepoVersion(repo, version)
    },

    /**
     * Fetch all versions of an APM Repo
     * @param appId 'finance.aragonpm.eth'
     */
    getAllVersions: async function(appId: string): Promise<ApmVersion[]> {
      const repo = new ethers.Contract(
        appId,
        repoAbi,
        provider
      ) as ApmRepoInstance
      const versionCount: number = await repo
        .getVersionsCount()
        .then(parseFloat)
      const versionIdxs = linspace(1, versionCount)
      return Promise.all(versionIdxs.map(async i => _getRepoVersion(repo, i)))
    },

    /**
     * Fetch a single version of an APM Repo and resolve its contents
     * @param appId 'finance.aragonpm.eth'
     * @param version Version to fetch: 'latest', '0.2.0', 14
     * @param options additional options to process version data
     * @param options.ipfsGateway 'http://localhost:8080' | 'https://my-remote-ipfs.io'
     */
    getVersionContent: async function(
      appId: string,
      version: 'latest' | string | number,
      options?: { ipfsGateway?: string }
    ): Promise<AragonApmRepoData> {
      const versionInfo = await this.getVersion(appId, version)

      const { contentUri } = versionInfo
      const ipfsGateway =
        (options || {}).ipfsGateway ||
        (optionsGlobal || {}).ipfsGateway ||
        defaultIpfsGateway
      const url = getFetchUrlFromContentUri(contentUri, { ipfsGateway })

      const [manifest, artifact] = await Promise.all([
        fetchJson<AragonManifest>(`${url}/manifest.json`),
        fetchJson<AragonArtifact>(`${url}/artifact.json`),
      ])

      return {
        ...versionInfo,
        ...manifest,
        ...artifact,
      }
    },
  }
}
