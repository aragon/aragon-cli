import ENS from 'ethjs-ens'
import {
  RepoContract,
  RepoInstance,
  APMRegistryContract,
  APMRegistryInstance
} from '~/typechain'
import Web3 from 'web3'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'
import { logBack } from '../logger'

const ENS_REGISTRY_ADDRESS = '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'
const APM_REGISTRY_ADDRESS = '0x32296d9f8fed89658668875dc73cacf87e8888b2'

/**
 * Attempts to retrieve an APM repository for the app, and if it can't
 * find one, creates a new repository for the app.
 * @returns Promise<RepoInstance> An APM repository for the app.
 */
export async function createRepo(
  appName: string,
  appId: string,
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts
): Promise<RepoInstance> {
  // Retrieve the Repo address from ens, or create the Repo if nothing is retrieved.
  let repoAddress: string | null = await _ensResolve(appId, web3).catch(
    () => null
  )
  if (!repoAddress) {
    repoAddress = await _createRepo(appName, web3, artifacts)
  }

  // Wrap Repo address with abi.
  const Repo: RepoContract = artifacts.require('Repo')
  const repo: RepoInstance = await Repo.at(repoAddress)

  return repo
}

/**
 * Updates an APM repository with a new version.
 */
export async function updateRepo(
  repo: RepoInstance,
  implementation: Truffle.ContractInstance,
  appServePort: number
): Promise<void> {
  // Calculate next valid semver.
  const semver: [number, number, number] = [
    (await repo.getVersionsCount()).toNumber() + 1, // Updates to smart contracts require major bump.
    0,
    0
  ]
  logBack(`Repo version: ${semver.join('.')}`)

  // URI where this plugin is serving the app's front end.
  const contentURI = `0x${Buffer.from(
    `http://localhost:${appServePort}`
  ).toString('hex')}`

  // Create a new version in the app's repo, with the new implementation.
  await repo.newVersion(semver, implementation.address, contentURI)
}

/**
 * Creates a new APM repository.
 * @returns Promise<RepoInstance> An APM repository for the app.
 */
async function _createRepo(
  appName: string,
  web3: Web3,
  artifacts: TruffleEnvironmentArtifacts
): Promise<string> {
  const rootAccount: string = (await web3.eth.getAccounts())[0]

  // Retrieve APMRegistry.
  const APMRegistry: APMRegistryContract = artifacts.require('APMRegistry')
  const apmRegistry: APMRegistryInstance = await APMRegistry.at(
    APM_REGISTRY_ADDRESS
  )

  // Create new repo.
  const txResponse: Truffle.TransactionResponse = await apmRegistry.newRepo(
    appName,
    rootAccount
  )

  // Retrieve repo address from creation tx logs.
  const logs: Truffle.TransactionLog[] = txResponse.logs
  const log: Truffle.TransactionLog | undefined = logs.find(
    l => l.event === 'NewRepo'
  )
  if (!log) {
    throw new Error('Error creating Repo. Unable to find NewRepo log.')
  }
  const repoAddress = (log as Truffle.TransactionLog).args.repo

  return repoAddress
}

/**
 * Resolves an ENS appId in hex form, to a contract address.
 * @returns Promise<string> The resolved contract address. Will throw if
 * no address is resolved.
 */
async function _ensResolve(appId: string, web3: Web3): Promise<string> {
  // Define options used by ENS.
  const opts: {
    provider: any
    registryAddress: string
  } = {
    provider: web3.currentProvider,
    registryAddress: ENS_REGISTRY_ADDRESS
  }

  // Avoids a bug on ENS.
  if (!opts.provider.sendAsync) {
    opts.provider.sendAsync = opts.provider.send
  }

  // Set up ENS and resolve address.
  const ens: ENS = new ENS(opts)
  const address: string | null = await ens.resolveAddressForNode(appId)

  if (!address) {
    throw new Error('Unable to resolve ENS addres.')
  }

  return address as string
}
