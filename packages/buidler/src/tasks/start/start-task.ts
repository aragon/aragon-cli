import path from 'path';
import chokidar from 'chokidar';
import { task } from '@nomiclabs/buidler/config';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts';
import { TASK_START, TASK_COMPILE } from '../task-names';
import { createDao } from './utils/backend/dao';
import { deployImplementation } from './utils/backend/app';
import { createProxy, updateProxy } from './utils/backend/proxy';
import { createRepo, updateRepo } from './utils/backend/repo';
import { setAllPermissionsOpenly } from './utils/backend/permissions';
import { installAragonClientIfNeeded, startAragonClient } from './utils/frontend/client';
import { buildAppFrontEnd, buildAppArtifacts, serveAppFrontEnd, watchAppFrontEnd } from './utils/frontend/build';
import { KernelInstance, RepoInstance } from '~/typechain';
import { getAppId } from './utils/id';
import { logBack } from './utils/logger';

/**
 * Main, composite, task. Calls startBackend, then startFrontend,
 * and then returns an unresolving promise to keep the task open.
 */
task(TASK_START, 'Starts Aragon app development').setAction(
  async (params, bre: BuidlerRuntimeEnvironment) => {
    console.log(`Starting...`);

    const { daoAddress, appAddress }  = await startBackend(bre);
    await startFrontend(daoAddress, appAddress);

    // Unresolving promise to keep task open.
    return new Promise(() => {});
  },
);

/**
 * Starts the task's backend sub-tasks. Logic is contained in ./tasks/start/utils/backend/.
 * Creates a Dao and a Repo for the app in development and watches for changes in
 * contracts. When contracts change, it compiles the contracts, deploys them and updates the
 * proxy in the Dao.
 * @returns Promise<{ daoAddress: string, appAddress: string }> Dao and app address that can
 * be used with an Aragon client to view the app.
 */
async function startBackend(bre: BuidlerRuntimeEnvironment): Promise<{ daoAddress: string, appAddress: string }> {
  const appName: string = 'counter';
  const appId: string = getAppId(appName);

  await bre.run(TASK_COMPILE);

  // Prepare a DAO and a Repo to hold the app.
  const dao: KernelInstance = await createDao();
  const repo: RepoInstance = await createRepo(appName, appId);

  // Deploy first implementation and set it in the Repo and in a Proxy.
  const implementation: Truffle.ContractInstance = await deployImplementation();
  const proxy: Truffle.ContractInstance = await createProxy(implementation, appId, dao);
  await updateRepo(repo, implementation);

  await setAllPermissionsOpenly(dao, proxy);

  // Watch back-end files. Debounce for performance
  chokidar
    .watch('./contracts/', {
      awaitWriteFinish: { stabilityThreshold: 1000 },
    })
    .on('change', async () => {
      console.log(`<<< Triggering backend build >>>`);
      await bre.run(TASK_COMPILE);

      // Update implementation and set it in Repo and Proxy.
      const newImplementation: Truffle.ContractInstance = await deployImplementation();
      await updateRepo(repo, newImplementation);
      await updateProxy(newImplementation, appId, dao);
    });

  logBack(`
  App name: ${appName}
  App id: ${appId}
  DAO: ${dao.address}
  APMRegistry: ${repo.address}
  App proxy: ${proxy.address}
`);

  return { daoAddress: dao.address, appAddress: proxy.address };
}

/**
 * Starts the task's frontend sub-tasks. Logic is contained in ./tasks/start/utils/frontend/.
 * Retrieves the Aragon client using git, builds it, builds the app's frontend and serves the build.
 * Starts the Aragon client pointed at a Dao and an app, and watches for changes on the app's sources.
 * If changes are detected, the app's frontend is rebuilt.
 */
async function startFrontend(daoAddress: string, appAddress: string): Promise<void> {
  await installAragonClientIfNeeded();

  // Initial build.
  await buildAppFrontEnd();
  await buildAppArtifacts();

  // Serve app files.
  serveAppFrontEnd();

  // Start Aragon client at the deployed address.
  const url: string = await startAragonClient(`${daoAddress}/${appAddress}`);
  console.log(`You can now view the Aragon client in the browser.
 Local:  ${url}
`);

  // Watch for changes to rebuild app.
  await watchAppFrontEnd();
}
