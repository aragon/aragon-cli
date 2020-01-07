import fs from 'fs';
import path from 'path';
import { task, internalTask } from '@nomiclabs/buidler/config';
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types';
import {
  TASK_START,
  TASK_START_NEW_DAO,
  TASK_START_NEW_APP_PROXY,
  TASK_START_UPDATE_PROXY_IMPLEMENTATION,
  TASK_START_WATCH_CONTRACTS,
  TASK_COMPILE
} from './task-names';
import filewatcher from 'filewatcher';

// Define internal tasks.
internalTask(TASK_START_NEW_DAO, newDao);
internalTask(TASK_START_NEW_APP_PROXY, newAppProxy);
internalTask(TASK_START_UPDATE_PROXY_IMPLEMENTATION, updateProxyImplementation);
internalTask(TASK_START_WATCH_CONTRACTS, watchContracts);

const BASE_NAMESPACE =
  '0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f';
const APP_ID = '0xDEADBEEF';

task(TASK_START, 'Starts Aragon app development').setAction(
  async ({}, { web3, run }: BuidlerRuntimeEnvironment) => {
    console.log(`Starting...`);

    // Compile contracts.
    await run(TASK_COMPILE);

    // Retrieve active accounts.
    const accounts: string[] = await web3.eth.getAccounts();
    const root = accounts[0];

    const dao = await run(TASK_START_NEW_DAO, { root });
    console.log(`New DAO created at: ${dao.address}`);

    const proxy = await run(TASK_START_NEW_APP_PROXY, { root, dao });
    console.log(`New app proxy created at: ${proxy.address}`);

    await run(TASK_START_WATCH_CONTRACTS, { root, dao });
  }
);

/**
 * Listens for changes in the app's main contract
 */
async function watchContracts(
  { root, dao },
  { run }: BuidlerRuntimeEnvironment
) {
  console.log(`Watching for changes in contracts...`);
  const mainContractPath = getMainContractPath();

  // Start the file watcher.
  const watcher = filewatcher();
  watcher.add(mainContractPath);
  watcher.on('change', async (file, stat) => {
    console.log(`Contract changed: ${file}`);

    await run(TASK_COMPILE);

    await run(TASK_START_UPDATE_PROXY_IMPLEMENTATION, { root, dao });
  });

  // Unresolving promise to keep task open.
  return new Promise((resolve, reject) => {});
}

/**
 * Updates the app proxy's implementation in the Kernel
 */
async function updateProxyImplementation(
  { root, dao },
  { artifacts }: BuidlerRuntimeEnvironment
) {
  console.log(`Updating implementation...`);

  // Deploy base implementation.
  const mainContractName = getMainContractName();
  const App = artifacts.require(mainContractName);
  const implementation = await App.new();
  console.log(`  New implementation: ${implementation.address}`);

  // Set the new implementation in the Kernel.
  await dao.setApp(BASE_NAMESPACE, APP_ID, implementation.address, {
    from: root
  });
}

/**
 * Creates a new app proxy
 * @return proxy App TruffleContract
 */
async function newAppProxy(
  { root, dao },
  { artifacts }: BuidlerRuntimeEnvironment
) {
  // Deploy base implementation.
  const mainContractName = getMainContractName();
  const App = artifacts.require(mainContractName);
  const implementation = await App.new();
  console.log(`  First implementation: ${implementation.address}`);

  // Create a new app proxy with base implementation.
  const { logs } = await dao.newAppInstance(
    APP_ID,
    implementation.address,
    '0x',
    false,
    { from: root }
  );

  // Retrieve proxy address and wrap around abi.
  const proxy = App.at(logs.find(l => l.event === 'NewAppProxy').args.proxy);

  return proxy;
}

/**
 * Deploys a new DAO
 * @return DAO's Kernel TruffleContract
 */
async function newDao({ root }, { artifacts }: BuidlerRuntimeEnvironment) {
  // Create Kernel instance.
  const Kernel = artifacts.require('Kernel');
  const dao = await Kernel.new(false);

  // Initialize Kernel instance.
  const ACL = artifacts.require('ACL');
  const aclBase = await ACL.new();
  await dao.initialize(aclBase.address, root);

  // Give first account the ability to manage apps.
  const acl = await ACL.at(await dao.acl());
  await acl.createPermission(
    root,
    dao.address,
    await dao.APP_MANAGER_ROLE(),
    root,
    { from: root }
  );

  return dao;
}

/**
 * Returns main contract path
 * @return "./contracts/Counter.sol"
 */
function getMainContractPath(): string {
  const arappPath = 'arapp.json';
  const contractsPath = './contracts';

  if (fs.existsSync(arappPath)) {
    const arapp: { path: string } = JSON.parse(
      fs.readFileSync(arappPath, 'utf-8')
    );
    return arapp.path;
  }

  // Try to guess contract path
  if (fs.existsSync(contractsPath)) {
    const contracts = fs.readdirSync(contractsPath);
    const mainContract = contracts.filter(
      name => name.endsWith('.sol') || name !== 'Imports.sol'
    );
    if (mainContract.length === 1)
      return path.join(contractsPath, mainContract[0]);
  }

  throw Error(`No arapp.json found in current folder`);
}

/**
 * Returns main contract name
 * @return "Counter"
 */
function getMainContractName(): string {
  const mainContractPath = getMainContractPath();
  return path.parse(mainContractPath).name;
}
