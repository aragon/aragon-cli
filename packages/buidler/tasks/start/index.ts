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

    const accounts: string[] = await web3.eth.getAccounts();
    const root = accounts[0];

    // const dao = await run(TASK_START_NEW_DAO, { root });
    const dao = await createDao(root, artifacts);
    console.log(`New DAO created at: ${dao.address}`);

    // const repo = await run(TASK_START_CREATE_APM_REPO, { root })
    const repo = await createRepo(root, artifacts);
    console.log(`New APM Repository created at: ${repo.address}`)

    // const proxy = await run(TASK_START_NEW_APP_PROXY, { root, dao });
    const proxy = await createProxy(APP_ID, root, dao, artifacts);
    console.log(`New app proxy created at: ${proxy.address}`);

    await run(TASK_START_WATCH_CONTRACTS, { root, dao });
  }
);

/**
 * Listens for changes in the app's main contract.
 */
async function watchContracts(
  { root, dao },
  { run, artifacts }: BuidlerRuntimeEnvironment
) {
  console.log(`Watching for changes in contracts...`);
  const mainContractPath = getMainContractPath();

  // Start the file watcher.
  const watcher = filewatcher();
  watcher.add(mainContractPath);
  watcher.on('change', async (file, stat) => {
    console.log(`Contract changed: ${file}`);

    await run(TASK_COMPILE);

    await updateProxy(APP_ID, root, dao, artifacts);
  });

  // Unresolving promise to keep task open.
  return new Promise((resolve, reject) => {});
}
