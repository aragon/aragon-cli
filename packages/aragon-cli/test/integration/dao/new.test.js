import test from 'ava'
import newDao from '../../../src/lib/dao/new'
import defaultAPMName from '@aragon/cli-utils/src/helpers/default-apm'
import { getLocalWeb3, isAddress } from '../test-utils'
import getApmRepo from '../../../src/lib/apm/getApmRepo'
import { ens } from '@aragon/aragen'

test.beforeEach(async t => {
  const web3 = await getLocalWeb3()

  t.context = {
    web3,
  }
})

// Disabled until IPFS is added to integration tests
// eslint-disable-next-line ava/no-skip-test
test.skip('Deploys DAO with valid template', async t => {
  t.plan(1)

  const { web3 } = t.context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    'latest',
    { ensRegistryAddress: ens }
  )

  const daoAddress = await newDao({
    repo,
    web3,
    newInstanceMethod: 'newInstance',
    newInstanceArgs: [],
    deployEvent: 'DeployDao',
  })

  t.true(isAddress(daoAddress))
})

// Disabled until IPFS is added to integration tests
// eslint-disable-next-line ava/no-skip-test
test.skip('Deploys DAO with template with custom newInstance method and args', async t => {
  t.plan(1)

  const { web3 } = t.context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('membership-template'),
    'latest',
    { ensRegistryAddress: ens }
  )

  const daoAddress = await newDao({
    repo,
    web3,
    newInstanceMethod: 'newTokenAndInstance',
    newInstanceArgs: [
      'Token name',
      'TKN',
      'daoname' + Math.floor(Math.random() * 1000000),
      ['0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'],
      ['500000000000000000', '50000000000000000', '604800'],
      '1296000',
      true,
    ],
    deployEvent: 'DeployDao',
  })

  t.true(isAddress(daoAddress))
})

test('Throws with invalid newInstance', async t => {
  t.plan(1)

  const { web3 } = t.context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    'latest',
    { ensRegistryAddress: ens }
  )

  await t.throwsAsync(
    newDao({
      repo,
      web3,
      newInstanceMethod: 'invalid',
      newInstanceArgs: [],
      deployEvent: 'DeployDao',
    })
  )
})

test('Throws with invalid deploy event', async t => {
  t.plan(1)

  const { web3 } = t.context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    'latest',
    { ensRegistryAddress: ens }
  )

  await t.throwsAsync(
    newDao({
      repo,
      web3,
      newInstanceMethod: 'newInstance',
      newInstanceArgs: [],
      deployEvent: 'invalid',
    })
  )
})
