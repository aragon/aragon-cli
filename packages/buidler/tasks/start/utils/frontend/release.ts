import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { TASK_FLATTEN_GET_FLATTENED_SOURCE } from '../../../task-names';
import { execaPipe } from './execaPipe';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';

export const appDist = 'dist';

export const manifestPath = 'manifest.json';
export const artifactPath = 'artifact.json';
export const arappPath = 'arapp.json';
export const codePath = 'code.sol';

/**
 * Builds the front-end with the customizable npm run script of the app
 * @param frontEndSrc "app/build" Where are the front-end built files after the build
 */
export async function buildAppFrontEnd(frontEndSrc: string): Promise<void> {
  await execaPipe('npm', ['run', 'build'], { cwd: frontEndSrc });
}

export async function watchAppFrontEnd(frontEndSrc: string): Promise<void> {
  await execaPipe('npm', ['run', 'watch'], { cwd: frontEndSrc });
}

/**
 * Generates the artifacts necessary for an Aragon App
 * - manifest.json
 * - artifact.json
 */
export async function buildAppArtifacts(): Promise<void> {
  for (const filePath of [manifestPath, artifactPath]) {
    await fsExtra.copy(filePath, path.join(appDist, filePath));
  }
}

/**
 * Flattens the contract code and writes it to a file
 */
export async function buildAppCode(
  env: BuidlerRuntimeEnvironment
): Promise<void> {
  const contractSource = await env.run(TASK_FLATTEN_GET_FLATTENED_SOURCE);
  fs.writeFileSync(path.join(appDist, codePath), contractSource);
}
