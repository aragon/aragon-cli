import path from 'path';
import namehash from 'eth-ens-namehash';
import liveServer from 'live-server';
import chokidar from 'chokidar';
import { task } from '@nomiclabs/buidler/config';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import { TruffleEnvironmentArtifacts } from '@nomiclabs/buidler-truffle5/src/artifacts';
import { TASK_START, TASK_COMPILE } from '../task-names';
import { createDao } from './utils/backend/dao';
import { deployImplementation } from './utils/backend/app';
import { createProxy, updateProxy } from './utils/backend/proxy';
import { createRepo, updateRepo } from './utils/backend/repo';
import { setPermissions } from './utils/backend/permissions';
import { installAragonClientIfNeeded, startAragonClient } from './utils/frontend/client';
import { buildAppFrontEnd, buildAppArtifacts, watchAppFrontEnd, buildOutputPath } from './utils/frontend/build';
import { KernelInstance, RepoInstance } from '../../../typechain';

/**
 * Main, composite, task.
 */
task(TASK_START, 'Starts Aragon app development').setAction(
  async (params, bre: BuidlerRuntimeEnvironment) => {
    console.log(`Starting...`);

    const { daoAddress, appAddress }  = await startBackend(bre);
    await startFrontend(daoAddress, appAddress, bre);

    // Unresolving promise to keep task open.
    return new Promise((resolve, reject) => {});
  },
);

async function startBackend(bre: BuidlerRuntimeEnvironment): Promise<{ daoAddress: string, appAddress: string }> {
  const appName: string = 'counter';
  const appId: string = namehash.hash(`${appName}.aragonpm.eth`);

  await bre.run(TASK_COMPILE);

  // Prepare a DAO and a Repo to hold the app.
  const dao: KernelInstance = await createDao();
  const repo: RepoInstance = await createRepo(appName, appId);

  // Deploy first implementation and set it in the Repo and in a Proxy.
  const implementation: Truffle.Contract<any> = await deployImplementation();
  const proxy: Truffle.Contract<any> = await createProxy(implementation, appId, dao);
  await updateRepo(repo, implementation);

  await setPermissions(dao, proxy);

  // Watch back-end files. Debounce for performance
  chokidar
    .watch('./contracts/', {
      awaitWriteFinish: { stabilityThreshold: 1000 },
    })
    .on('change', async () => {
      console.log(`<<< Triggering backend build >>>`);
      await bre.run(TASK_COMPILE);

      // Update implementation and set it in Repo and Proxy.
      const newImplementation: Truffle.Contract<any> = await deployImplementation();
      await updateRepo(repo, newImplementation);
      await updateProxy(implementation, appId, dao);
    });

  console.log(`App name: ${appName}`);
  console.log(`App id: ${appId}`);
  console.log(`DAO: ${dao.address}`);
  console.log(`APMRegistry: ${repo.address}`);
  console.log(`App proxy: ${proxy.address}`);

  return { daoAddress: dao.address, appAddress: proxy.address };
}

async function startFrontend(
  daoAddress: string,
  appAddress: string,
  env: BuidlerRuntimeEnvironment,
): Promise<void> {
  await installAragonClientIfNeeded();

  // Initial build.
  const appPath = path.resolve('app');
  await buildAppFrontEnd(appPath);
  await buildAppArtifacts();

  // Serve app files.
  liveServer.start({
    port: 8001,
    root: buildOutputPath,
    open: false,
    wait: 1000,
    cors: true,
  });

  // Start Aragon client at the deployed address
  const url: string = await startAragonClient(`${daoAddress}/${appAddress}`);
  console.log(`You can now view the Aragon client in the browser.
 Local:  ${url}
`);

  // Watch for changes and rebuild app.
  await watchAppFrontEnd(appPath);
}
