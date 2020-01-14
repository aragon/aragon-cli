import path from 'path';
import namehash from 'eth-ens-namehash';
import liveServer from 'live-server';
import chokidar from 'chokidar';

import { task } from '@nomiclabs/buidler/config';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts';
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
  installAragonClientIfNeeded,
  startAragonClient,
  buildAppFrontEnd,
  watchAppFrontEnd,
  buildAppArtifacts,
  appDist
} from './utils/frontend';

import {
  KernelInstance,
  RepoInstance
} from '../../typechain';

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

async function startBackend(
  bre: BuidlerRuntimeEnvironment
): Promise<{ daoAddress: string, appAddress: string }> {
  // Compile contracts.
  await bre.run(TASK_COMPILE);

  // Retrieve active accounts.
  const accounts: string[] = await web3.eth.getAccounts();
  const root: string = accounts[0];

  // Create a DAO.
  const dao: KernelInstance = await createDao(root, bre.artifacts);
  console.log(`DAO: ${dao.address}`);

  // Define app name and id.
  const appName: string = 'counter';
  console.log(`App name: ${appName}`)
  const appId: string = namehash.hash(`${appName}.aragonpm.eth`);
  console.log(`App id: ${appId}`)

  // Create an APM repo for the app.
  const repo: RepoInstance = await createOrRetrieveRepo(web3, appName, appId, root, bre.artifacts);
  console.log(`APMRegistry: ${repo.address}`)

  // Retrieve the first implementation for the app.
  const implementation: Truffle.Contract<any> = await deployImplementation(bre.artifacts)
  console.log(`App implementation: ${implementation.address}`)

  // Set the repo's first implementation.
  await updateRepo(repo, implementation);

  // Create a proxy for the app (also setting it's first implementation).
  const proxy: Truffle.Contract<any> = await createProxy(implementation, appId, root, dao, bre.artifacts);
  console.log(`App proxy: ${proxy.address}`);

  // Set the app's permissions.
  // TODO: Must also be reset on contract updates.
  await setPermissions(dao, proxy, root, bre.artifacts);

  // Watch back-end files. Debounce for performance
  chokidar
    .watch(getMainContractPath(), {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('change', async (event, path) => {
      console.log(`<<< Triggering backend build >>>`);

      // Compile contracts.
      await bre.run(TASK_COMPILE);

      // Retrieve the new implementation for the app.
      const implementation: Truffle.Contract<any> = await deployImplementation(bre.artifacts)
      console.log(`App implementation: ${implementation.address}`)

      // Update the APM's repo.
      await updateRepo(repo, implementation);

      // Update the proxy's implementation.
      await updateProxy(implementation, appId, root, dao, bre.artifacts);
    });

  return { daoAddress: dao.address, appAddress: proxy.address };
}

async function startFrontend(
  daoAddress: string,
  appAddress: string,
  env: BuidlerRuntimeEnvironment
): Promise<void> {
  await installAragonClientIfNeeded();

  // Initial build.
  const appPath = path.resolve('app');
  await buildAppFrontEnd(appPath);
  await buildAppArtifacts();

  // Watch for changes and rebuild app.
  await watchAppFrontEnd(appPath);

  // Serve app files.
  liveServer.start({
    port: 8001,
    root: appDist,
    open: false,
    wait: 1000,
    cors: true
  });

  // Start Aragon client at the deployed address
  const url: string = await startAragonClient(`${daoAddress}/${appAddress}`);
  console.log(`You can now view the Aragon client in the browser.
 Local:  ${url}
`);
}
