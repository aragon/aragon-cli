import filewatcher from 'filewatcher';
import namehash from 'eth-ens-namehash';

import { task, internalTask } from '@nomiclabs/buidler/config';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import {
  TASK_START,
  TASK_START_WATCH_CONTRACTS,
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

internalTask(TASK_START_WATCH_CONTRACTS, watchContracts);

/**
 * Main, composite, task.
 */
task(TASK_START, 'Starts Aragon app development').setAction(
  async ({}, { web3, run, artifacts }: BuidlerRuntimeEnvironment) => {
    console.log(`Starting...`);

    await run(TASK_COMPILE);

    // Retrieve active accounts.
    const accounts: string[] = await web3.eth.getAccounts();
    const root = accounts[0];

    // Create a DAO.
    const dao = await createDao(root, artifacts);
    console.log(`DAO: ${dao.address}`);

    // Define app name and id.
    const appName = 'counter.aragonpm.eth';
    console.log(`App name: ${appName}`)
    const appId = namehash.hash(appName);
    console.log(`App id: ${appId}`)

    // Create an APM repo for the app.
    const repo = await createOrRetrieveRepo(web3, appName, root, artifacts);
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

    await run(TASK_START_WATCH_CONTRACTS, { root, dao, repo, appId });
  }
);

/**
 * Listens for changes in the app's main contract.
 */
async function watchContracts(
  { root, dao, repo, appId },
  { run, artifacts }: BuidlerRuntimeEnvironment
) {
  console.log(`Watching for changes in contracts...`);
  const mainContractPath = getMainContractPath();

  // Start the file watcher.
  const watcher = filewatcher();
  watcher.add(mainContractPath);
  watcher.on('change', async (file, stat) => {
    console.log(`<<<CHANGES DETECTED>>> ${file}`);

    await run(TASK_COMPILE);

    // Retrieve the new implementation for the app.
    const implementation = await deployImplementation(artifacts)
    console.log(`App implementation: ${implementation.address}`)

    // Update the APM's repo.
    await updateRepo(repo, implementation);

    // Update the proxy's implementation.
    await updateProxy(implementation, appId, root, dao, artifacts);
  });

  // Unresolving promise to keep task open.
  return new Promise((resolve, reject) => {});
}
