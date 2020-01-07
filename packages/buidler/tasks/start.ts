import { task, internalTask } from '@nomiclabs/buidler/config';

import {
  TASK_START,
  TASK_START_NEW_DAO,
  TASK_START_NEW_APP_PROXY,
} from './task-names'

task(TASK_START, 'Starts Aragon app development')
  .setAction(async ({}, { run }) => {
    console.log(`Starting...`);

    internalTask(TASK_START_NEW_DAO, newDao);
    internalTask(TASK_START_NEW_APP_PROXY, newAppProxy);

    const dao = await run(TASK_START_NEW_DAO);
    console.log(`New DAO created at: ${dao.address}`);

    const proxy = await run(TASK_START_NEW_APP_PROXY, { dao })
    console.log(`New proxy created at: ${proxy.address}`)
  });

const newAppProxy = async ({ dao }, { web3, artifacts }) => {
  // Retrieve active accounts.
  const accounts = await web3.eth.getAccounts();
  const root = accounts[0];

  // Create app instance.
  const App = artifacts.require('Counter');
  const appBase = await App.new();

  // Retrieve proxy address and wrap around abi.
  const { logs } = await dao.newAppInstance('0xDeAdBeEf', appBase.address, '0x', false, { from: root });
  const proxy = App.at(logs.find(l => l.event === 'NewAppProxy').args.proxy);

  return proxy;
};

const newDao = async ({}, { web3, artifacts }) => {
  // Retrieve active accounts.
  const accounts = await web3.eth.getAccounts();
  const root = accounts[0];

  // Create Kernel instance.
  const Kernel = artifacts.require('Kernel');
  const dao = await Kernel.new(false);

  // Initialize Kernel instance.
  const ACL = artifacts.require('ACL');
  const aclBase = await ACL.new();
  await dao.initialize(aclBase.address, root);

  // Give first account the APP_MANAGER_ROLE.
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
