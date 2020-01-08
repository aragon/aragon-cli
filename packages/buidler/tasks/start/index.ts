import filewatcher from 'filewatcher';

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
  createRepo,
  updateRepo,
  getMainContractName,
  getMainContractPath
} from './utils';

internalTask(TASK_START_WATCH_CONTRACTS, watchContracts);

const APP_ID = '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF';

/**
 * Main, composite, task.
 */
task(TASK_START, 'Starts Aragon app development').setAction(
  async ({}, { web3, run, artifacts }: BuidlerRuntimeEnvironment) => {
    console.log(`Starting...`);

    // await run(TASK_COMPILE);

    // Retrieve active accounts.
    const accounts: string[] = await web3.eth.getAccounts();
    const root = accounts[0];

    // Create a DAO.
    const dao = await createDao(root, artifacts);
    console.log(`New DAO created at: ${dao.address}`);

    // Create an APM repo for the app.
    const repo = await createRepo(root, artifacts);
    console.log(`New APM Repository created at: ${repo.address}`)

    // Retrieve the first implementation for the app.
    const implementation = await deployImplementation(artifacts)
    console.log(`First App implementation: ${implementation.address}`)

    // Set the repo's first implementation.
    await updateRepo(repo, implementation);

    // Create a proxy for the app (also setting it's first implementation).
    const proxy = await createProxy(implementation, APP_ID, root, dao, artifacts);
    console.log(`New app proxy created at: ${proxy.address}`);

    await run(TASK_START_WATCH_CONTRACTS, { root, dao, repo });
  }
);

/**
 * Listens for changes in the app's main contract.
 */
async function watchContracts(
  { root, dao, repo },
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
    console.log(`New implementation: ${implementation.address}`)

    // Update the APM's repo.
    await updateRepo(repo, implementation);

    // Update the proxy's implementation.
    await updateProxy(implementation, APP_ID, root, dao, artifacts);
  });

  // Unresolving promise to keep task open.
  return new Promise((resolve, reject) => {});
}
