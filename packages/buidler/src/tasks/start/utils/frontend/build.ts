import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import liveServer from 'live-server';
import { AragonConfig } from '~/src/types';
import { execaPipe, execaLogTo } from '../execa';
import { logFront } from '../logger';
import { getConfig } from '~/src/config';

export const manifestPath = 'manifest.json';
export const artifactPath = 'artifact.json';
export const arappPath = 'arapp.json';

const execa = execaLogTo(logFront);

/**
 * Builds the front-end with the customizable npm run script of the app
 */
export async function buildAppFrontEnd(): Promise<void> {
  await execa('npm', ['run', 'build'], { cwd: getConfig().appSrcPath });
}

/**
 * Watches the front-end with the customizable npm run script of the app
 */
export async function watchAppFrontEnd(): Promise<void> {
  await execa('npm', ['run', 'watch'], { cwd: getConfig().appSrcPath });
}

export function serveAppFrontEnd(): void {
  const config: AragonConfig = getConfig();

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
    await fsExtra.copy(filePath, path.join(getConfig().appBuildOutputPath as string, filePath));
  }
}
