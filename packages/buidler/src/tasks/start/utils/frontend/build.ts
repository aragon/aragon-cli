import path from 'path'
import fsExtra from 'fs-extra'
import { execaLogTo } from '../execa'
import { logFront } from '../logger'
import * as toolkit from '@aragon/toolkit/dist/helpers/generateArtifact.js'
import { readArapp, getMainContractName, getMainContractPath } from '../arapp'
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts'

export const manifestPath = 'manifest.json'
export const artifactPath = 'artifact.json'
export const arappPath = 'arapp.json'

const execa = execaLogTo(logFront)

/**
 * Watches the front-end with the customizable npm run script of the app
 */
export async function watchAppFrontEnd(appSrcPath: string): Promise<void> {
  await execa('npm', ['run', 'watch'], { cwd: appSrcPath })
}

/**
 * Generates the artifacts necessary for an Aragon App
 * - manifest.json
 * - artifact.json
 */
export async function buildAppArtifacts(
  appBuildOutputPath: string,
  artifacts: TruffleEnvironmentArtifacts
): Promise<void> {
  await _copyManifest(appBuildOutputPath)
  await _generateUriArtifacts(appBuildOutputPath, artifacts)
}

async function _copyManifest(appBuildOutputPath: string): Promise<void> {
  await fsExtra.copy(
    manifestPath,
    path.join(appBuildOutputPath as string, manifestPath)
  )
}

async function _generateUriArtifacts(
  appBuildOutputPath: string,
  artifacts: TruffleEnvironmentArtifacts
): Promise<void> {
  // Retrieve main contract abi.
  const mainContractName: string = getMainContractName()
  const App: any = artifacts.require(mainContractName)
  const abi = App.abi

  // Retrieve contract source code.
  const mainContractPath = getMainContractPath()
  const source = await fsExtra.readFileSync(mainContractPath, 'utf8')

  // Retrieve arapp file.
  const arapp = readArapp()

  // Generate artifacts file.
  const appArtifacts = await toolkit.generateApplicationArtifact(
    arapp,
    abi,
    source
  )

  // Write artifacts to file.
  await fsExtra.writeJSON(
    path.join(appBuildOutputPath as string, 'artifact.json'),
    appArtifacts,
    { spaces: 2 }
  )
}
