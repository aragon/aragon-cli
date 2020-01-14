import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { execaPipe } from './execaPipe';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';

export const appDist = 'dist';

export const manifestPath = 'manifest.json';
export const artifactPath = 'artifact.json';
export const arappPath = 'arapp.json';
export const codePath = 'code.sol';

/**
 * Builds the front-end with the customizable npm run script of the app
 * @param appPath "app/build" Where are the front-end built files after the build
 */
export async function buildAppFrontEnd(appPath: string): Promise<void> {
  await execaPipe('npm', ['run', 'build'], { cwd: appPath });
}

export async function watchAppFrontEnd(appPath: string): Promise<void> {
  await execaPipe('npm', ['run', 'watch'], { cwd: appPath });
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
