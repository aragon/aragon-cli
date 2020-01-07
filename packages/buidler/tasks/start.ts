import { task, internalTask } from '@nomiclabs/buidler/config';

import {
  TASK_START,
  TASK_START_NEW_DAO,
  TASK_START_NEW_APP_PROXY,
  TASK_START_UPDATE_PROXY_IMPLEMENTATION,
  TASK_START_WATCH_CONTRACTS
} from './task-names'

// import {
//   TASK_COMPILE
// } from '@nomiclabs/buidler/src/builtin-tasks/task-names'

import filewatcher from 'filewatcher'

const BASE_NAMESPACE = '0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f';
const APP_ID = '0xDEADBEEF';

task(TASK_START, 'Starts Aragon app development')
  .setAction(async ({}, { web3, run }) => {
    console.log(`Starting...`);

    // Define internal tasks.
    internalTask(TASK_START_NEW_DAO, newDao);
    internalTask(TASK_START_NEW_APP_PROXY, newAppProxy);
    internalTask(TASK_START_UPDATE_PROXY_IMPLEMENTATION, updateProxyImplementation);
    internalTask(TASK_START_WATCH_CONTRACTS, watchContracts)

    // Compile contracts.
    await run('compile')

    // Retrieve active accounts.
    const accounts = await web3.eth.getAccounts();
    const root = accounts[0];

    const dao = await run(TASK_START_NEW_DAO, { root });
    console.log(`New DAO created at: ${dao.address}`);

    const proxy = await run(TASK_START_NEW_APP_PROXY, { root, dao });
    console.log(`New app proxy created at: ${proxy.address}`);

    await run(TASK_START_WATCH_CONTRACTS, { root, dao })
  });

const watchContracts = async ({ root, dao }, { run }) => {
  console.log(`Watching for changes in contracts...`);

  // Start the file watcher.
  const watcher = filewatcher();
  watcher.add('./contracts/Counter.sol');
  watcher.on('change', async (file, stat) => {
    console.log(`Contract changed: ${file}`);

    await run('compile')

    await run(TASK_START_UPDATE_PROXY_IMPLEMENTATION, { root, dao });
  })

  // Unresolving promise to keep task open.
  return new Promise((resolve, reject) => {})
}

const updateProxyImplementation = async ({ root, dao }, { artifacts }) => {
  console.log(`Updating implementation...`)

  // Deploy base implementation.
  const App = artifacts.require('Counter');
  const implementation = await App.new();
  console.log(`  New implementation: ${ implementation.address }`)

  // Set the new implementation in the Kernel.
  await dao.setApp(BASE_NAMESPACE, APP_ID, implementation.address, { from: root })
}

const newAppProxy = async ({ root, dao }, { artifacts }) => {
  // Deploy base implementation.
  const App = artifacts.require('Counter');
  const implementation = await App.new();
  console.log(`  First implementation: ${ implementation.address }`)

  // Create a new app proxy with base implementation.
  const { logs } = await dao.newAppInstance(APP_ID, implementation.address, '0x', false, { from: root });

  // Retrieve proxy address and wrap around abi.
  const proxy = App.at(logs.find(l => l.event === 'NewAppProxy').args.proxy);

  return proxy;
};

const newDao = async ({ root }, { artifacts }) => {
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
};
