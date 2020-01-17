import path from 'path';
import fsExtra from 'fs-extra';
import { execaLogTo } from '../execa';
import { logFront } from '../logger';
import { getConfig } from '~/src/config';

export const manifestPath = 'manifest.json';
export const artifactPath = 'artifact.json';
export const arappPath = 'arapp.json';

const execa = execaLogTo(logFront);

/**
 * Watches the front-end with the customizable npm run script of the app
 */
export async function watchAppFrontEnd(): Promise<void> {
  await execa('npm', ['run', 'watch'], { cwd: getConfig().appSrcPath });
}

/**
 * Generates the artifacts necessary for an Aragon App
 * - manifest.json
 * - artifact.json
 */
export async function buildAppArtifacts(): Promise<void> {
  for (const filePath of [manifestPath, artifactPath]) {
    await fsExtra.copy(
      filePath,
      path.join(getConfig().appBuildOutputPath as string, filePath)
    );
  }
}
