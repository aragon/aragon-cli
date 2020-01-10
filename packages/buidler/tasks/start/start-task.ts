import path from 'path';
import namehash from 'eth-ens-namehash';
import liveServer from 'live-server';
import chokidar from 'chokidar';
import debounce from 'debounce';

import { task } from '@nomiclabs/buidler/config';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import {
  TASK_START,
  TASK_COMPILE,
} from '../task-names';

import {
  createDao,
  deployImplementation,
  createProxy,
  updateProxy,
  createOrRetrieveRepo,
  updateRepo,
  setPermissions,
  getMainContractName,
  getMainContractPath
} from './utils/backend';
import {
  prepareAragonClient,
  startAragonClient,
  buildAppFrontEnd,
  buildAppArtifacts,
  buildAppCode,
  appDist
} from './utils/frontend';

/**
 * Main, composite, task.
 */
task(TASK_START, 'Starts Aragon app development').setAction(
  async ({}, env: BuidlerRuntimeEnvironment) => {
    console.log(`Starting...`);

    const { daoAddress, appAddress }  = await startBackend(env);
    await startFrontend(daoAddress, appAddress, env);

    // Unresolving promise to keep task open.
    return new Promise((resolve, reject) => {});
  }
);

async function startBackend(env: BuidlerRuntimeEnvironment): Promise<{ daoAddress: string, appAddress: string }> {
  const { run, web3, artifacts } = env;

  // Compile contracts.
  await run(TASK_COMPILE);

  // Retrieve active accounts.
  const accounts: string[] = await web3.eth.getAccounts();
  const root = accounts[0];

  // Create a DAO.
  const dao = await createDao(root, artifacts);
  console.log(`DAO: ${dao.address}`);

  // Define app name and id.
  const appName = 'counter';
  console.log(`App name: ${appName}`)
  const appId = namehash.hash(`${appName}.aragonpm.eth`);
  console.log(`App id: ${appId}`)

  // Create an APM repo for the app.
  const repo = await createOrRetrieveRepo(web3, appName, appId, root, artifacts);
  console.log(`APMRegistry: ${repo.address}`)

  // Retrieve the first implementation for the app.
  const implementation = await deployImplementation(artifacts)
  console.log(`App implementation: ${implementation.address}`)

  // Set the repo's first implementation.
  await updateRepo(repo, implementation);

  // Create a proxy for the app (also setting it's first implementation).
  const proxy = await createProxy(implementation, appId, root, dao, artifacts);
  console.log(`App proxy: ${proxy.address}`);

  // Set the app's permissions.
  // TODO: Must also be reset on contract updates.
  await setPermissions(dao, proxy, root, artifacts);

  // Watch back-end files. Debounce for performance
  chokidar
    .watch(getMainContractPath(), {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('all', async (event, path) => {
      console.log(`Triggering backend build`);

      await run(TASK_COMPILE);

      // Retrieve the new implementation for the app.
      const implementation = await deployImplementation(artifacts)
      console.log(`App implementation: ${implementation.address}`)

      // Update the APM's repo.
      await updateRepo(repo, implementation);

      // Update the proxy's implementation.
      await updateProxy(implementation, appId, root, dao, artifacts);
    });

  return { daoAddress: dao.address, appAddress: proxy.address };
}

async function startFrontend(daoAddress, appAddress, env: BuidlerRuntimeEnvironment) {
  // Make sure the client is ready before starting the servers
  await prepareAragonClient({});

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
      console.log(`Triggering frontend build for ${path}`);
      await buildAppFrontEndDebounced(frontEndSrc);
    });
}
