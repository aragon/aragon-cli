import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import liveServer from 'live-server';
import { execaPipe } from '../execa';
import { getConfig } from '~/src/config';

export const manifestPath = 'manifest.json';
export const artifactPath = 'artifact.json';
export const arappPath = 'arapp.json';

/**
 * Builds the front-end with the customizable npm run script of the app
 */
export async function buildAppFrontEnd(): Promise<void> {
  await execaPipe('npm', ['run', 'build'], { cwd: getConfig().appSrcPath });
}

/**
 * Watches the front-end with the customizable npm run script of the app
 */
export async function watchAppFrontEnd(): Promise<void> {
  await execaPipe('npm', ['run', 'watch'], { cwd: getConfig().appSrcPath });
}

export function serveAppFrontEnd(): void {
  const config = getConfig();

  liveServer.start({
    port: config.appServePort,
    root: config.appBuildOutputPath,
    open: false,
    wait: 1000,
    cors: true,
  });
}

/**
 * Generates the artifacts necessary for an Aragon App
 * - manifest.json
 * - artifact.json
 */
export async function buildAppArtifacts(): Promise<void> {
  for (const filePath of [manifestPath, artifactPath]) {
    await fsExtra.copy(filePath, path.join(getConfig().appBuildOutputPath, filePath));
  }
}
