import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { execaPipe } from '../execa';
import config from '~/buidler.config';

export const manifestPath = 'manifest.json';
export const artifactPath = 'artifact.json';
export const arappPath = 'arapp.json';

/**
 * Builds the front-end with the customizable npm run script of the app
 * @param appPath "app/build" Where are the front-end built files after the build
 */
export async function buildAppFrontEnd(): Promise<void> {
  await execaPipe('npm', ['run', 'build'], { cwd: config.aragon.appSrcPath });
}

export async function watchAppFrontEnd(): Promise<void> {
  await execaPipe('npm', ['run', 'watch'], { cwd: config.aragon.appSrcPath });
}

/**
 * Generates the artifacts necessary for an Aragon App
 * - manifest.json
 * - artifact.json
 */
export async function buildAppArtifacts(): Promise<void> {
  for (const filePath of [manifestPath, artifactPath]) {
    await fsExtra.copy(filePath, path.join(config.aragon.appBuildOutputPath, filePath));
  }
}
