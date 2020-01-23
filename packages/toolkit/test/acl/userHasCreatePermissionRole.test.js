import test from 'ava'
import { ens } from '@aragon/aragen'
//
import newDao from '../../src/dao/new'
import getApmRepo from '../../src/apm/getApmRepo'
import userHasCreatePermissionRole from '../../src/acl/userHasCreatePermissionRole'
import defaultAPMName from '../../src/helpers/default-apm'
import { getLocalWeb3 } from '../test-helpers'

test.beforeEach(async t => {
  const web3 = await getLocalWeb3()

  t.context = {
    web3,
    userAddress0: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    userAddress1: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
  }
})

// eslint-disable-next-line ava/no-skip-test
test('getAllApps returns the correct apps', async t => {
  const { web3, userAddress0, userAddress1 } = t.context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    { ensRegistryAddress: ens },
    'latest'
  )

  const daoAddress = await newDao({
    repo,
    web3,
    newInstanceMethod: 'newInstance',
    newInstanceArgs: [],
    deployEvent: 'DeployDao',
  })

  const hasPermission0 = await userHasCreatePermissionRole(
    daoAddress,
    userAddress0,
    web3
  )

  const hasPermission1 = await userHasCreatePermissionRole(
    daoAddress,
    userAddress1,
    web3
  )

  t.is(hasPermission0, true)
  t.is(hasPermission1, false)
})
