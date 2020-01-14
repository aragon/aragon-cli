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
  const appName: string = 'counter';
  const appId: string = namehash.hash(`${appName}.aragonpm.eth`);

  await bre.run(TASK_COMPILE);

  const rootAccount: string = (await web3.eth.getAccounts())[0];

  // Prepare a DAO and a Repo to hold the app.
  const dao: KernelInstance = await createDao(rootAccount, bre.artifacts);
  const repo: RepoInstance = await createOrRetrieveRepo(web3, appName, appId, rootAccount, bre.artifacts);

  // Deploy first implementation and set it in the Repo and in a Proxy.
  const implementation: Truffle.Contract<any> = await deployImplementation(bre.artifacts)
  const proxy: Truffle.Contract<any> = await createProxy(implementation, appId, rootAccount, dao, bre.artifacts);
  await updateRepo(repo, implementation);

  await setPermissions(dao, proxy, rootAccount, bre.artifacts);

  // Watch back-end files. Debounce for performance
  chokidar
    .watch(getMainContractPath(), {
      awaitWriteFinish: { stabilityThreshold: 1000 }
    })
    .on('change', async (event, path) => {
      console.log(`<<< Triggering backend build >>>`);
      await bre.run(TASK_COMPILE);

      // Update implementation and set it in Repo and Proxy.
      const implementation: Truffle.Contract<any> = await deployImplementation(bre.artifacts)
      await updateRepo(repo, implementation);
      await updateProxy(implementation, appId, rootAccount, dao, bre.artifacts);
    });

  console.log(`App name: ${appName}`)
  console.log(`App id: ${appId}`)
  console.log(`DAO: ${dao.address}`);
  console.log(`APMRegistry: ${repo.address}`)
  console.log(`App proxy: ${proxy.address}`);

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
