import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import os from 'os';
import open from 'open';
import { createStaticWebserver } from './webserver';
import { execaPipe } from '../execa';
import { getConfig } from '~/src/config';

const defaultRepo: string = 'https://github.com/aragon/aragon';
const defaultVersion: string = '775edd606333a111eb2693df53900039722a95dc';
const aragonBaseDir: string = path.join(os.homedir(), '.aragon');

export async function installAragonClientIfNeeded(
  repo: string = defaultRepo,
  version: string = defaultVersion,
): Promise<string> {
  // Determine client path.
  const clientPath: string = _getClientPath(version);

  // Verify installation or install if needed.
  if (fs.existsSync(path.resolve(clientPath))) {
    console.log('Using cached client version');
  } else {
    fsExtra.ensureDirSync(clientPath, { recursive: true });
    console.log(`Installing client version ${version} locally`);
    const opts = { cwd: clientPath };
    await execaPipe('git', ['clone', '--', repo, clientPath]);
    await execaPipe('git', ['checkout', version], opts);
    await execaPipe('npm', ['install'], opts);
    await execaPipe('npm', ['run', 'build:local'], opts);
  }

  return clientPath;
}

/**
 * Prepares and starts the aragon client
 * @return The URL at which the client is available
 */
export async function startAragonClient(
  subPath?: string,
  repo: string = defaultRepo,
  version: string = defaultVersion,
  autoOpen: boolean = true,
): Promise<string> {
  const port: number = getConfig().clientServePort as number;
  const clientPath: string = _getClientPath(version);

  console.log(`Starting client server at port ${repo}`);
  await createStaticWebserver(port, path.join(clientPath, 'build'));

  const url = `http://localhost:${port}/#/${subPath}`;

  if (autoOpen) {
    await open(url);
  }

  return url;
}

function _getClientPath(version: string): string {
  return path.join(aragonBaseDir, `client-${version}`);
}
