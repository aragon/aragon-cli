import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import liveServer from 'live-server';
import chokidar from 'chokidar';
import debounce from 'debounce';
import {
  prepareAragonClient,
  startAragonClient
} from './start/utils/frontend/aragonClient';
import {
  buildAppFrontEnd,
  buildAppArtifacts,
  buildAppCode,
  appDist
} from './start/utils/frontend/release';
import { task } from '@nomiclabs/buidler/config';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';

task('start-frontend', 'Starts Aragon app development').setAction(
  async ({}, env: BuidlerRuntimeEnvironment) => {
    // Make sure the client is ready before starting the servers
    await prepareAragonClient({});

    console.log(`Starting...`);

    const frontEndSrc = path.resolve('app');

    // Initial release build
    await buildAppFrontEnd(frontEndSrc);
    await buildAppArtifacts();
    await buildAppCode(env);

    // Start a live-server for the Aragon App assets
    liveServer.start({
      port: 8181, // Set the server port. Defaults to 8080.
      root: appDist, // Set root directory that's being served. Defaults to cwd.
      open: false, // When false, it won't load your browser by default.
      ignore: 'build', // comma-separated string for paths to ignore
      wait: 1000 // Waits for all changes, before reloading. Defaults to 0 sec.
    });

    // Start Aragon client at the deployed address
    const daoAddress = '';
    const appAddress = '';
    const subPath = `${daoAddress}/${appAddress}`;
    const url = await startAragonClient({ subPath });
    console.log(`You can now view the Aragon client in the browser.
   Local:  ${url}
 `);

    // Watch front-end files. Debounce for performance
    const buildAppFrontEndDebounced = debounce(buildAppFrontEnd, 500);
    chokidar
      .watch(frontEndSrc, {
        ignored: /build/, // ignore dotfiles
        awaitWriteFinish: { stabilityThreshold: 1000 }
      })
      .on('all', async (event, path) => {
        console.log(`Triggering build for ${path}`);
        await buildAppFrontEndDebounced(frontEndSrc);
      });

    // Unresolving promise to keep task open.
    return new Promise((resolve, reject) => {});
  }
);
