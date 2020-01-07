import { task } from '@nomiclabs/buidler/config';
import { TASK_NEW_DAO } from './task-names'

import _newDao from './adapters/dao/_new'

task(TASK_NEW_DAO, 'Deploys a new Aragon DAO')
  .setAction(async ({}, { web3 }) => {
    const dao = await _newDao(web3)
    console.log(dao)
  })
