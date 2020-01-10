import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import os from 'os';
import open from 'open';
import { createStaticWebserver } from './staticWebserver';
import { execaPipe } from '../index';

const defaultRepo = 'https://github.com/aragon/aragon';
const defaultVersion = '775edd606333a111eb2693df53900039722a95dc';
const defaultPort = 3000;
const aragonBaseDir = path.join(os.homedir(), '.aragon');

export async function prepareAragonClient({
  clientPath,
  repo = defaultRepo,
  version = defaultVersion
}: {
  clientPath?: string;
  repo?: string;
  version?: string;
}): Promise<string> {
  const isCustomClientPath = Boolean(clientPath);
  if (!clientPath) clientPath = path.join(aragonBaseDir, `client-${version}`);

  // Fetching client from aragen
  if (isCustomClientPath) {
    console.log('Using custom client path');
  } else {
    // Make sure we haven't already downloaded the client
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
  }

  return clientPath;
}

/**
 * Prepares and starts the aragon client
 * @return The URL at which the client is available
 */
export async function startAragonClient({
  subPath,
  clientPath,
  repo = defaultRepo,
  version = defaultVersion,
  port = defaultPort,
  autoOpen = true
}: {
  subPath?: string;
  clientPath?: string;
  repo?: string;
  version?: string;
  port?: number;
  autoOpen?: boolean;
}): Promise<string> {
  clientPath = await prepareAragonClient({ clientPath, repo, version });

  console.log(`Starting client server at port ${repo}`);
  await createStaticWebserver(port, path.join(clientPath, 'build'));

  const url = `http://localhost:${port}/#/${subPath}`;

  if (autoOpen) await open(url);

  return url;
}
