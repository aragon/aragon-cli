import { ens } from '@aragon/aragen'
//
import getApmRepo from '../../src/apm/getApmRepo'
import newDao from '../../src/dao/new'
import defaultAPMName from '../../src/helpers/default-apm'
import { getLocalWeb3, isAddress } from '../test-helpers'

let context, web3
jest.setTimeout(60000)
beforeEach(async () => {
  web3 = await getLocalWeb3()

  context = {
    web3,
  }
})

afterEach(async () => {
  await web3.currentProvider.connection.close()
})

test('Deploys DAO with valid template', async () => {
  const { web3 } = context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    { ensRegistryAddress: ens },
    'latest'
  )

  const daoAddress = await newDao({
    repo,
    web3,
    // newInstanceMethod: 'newInstance',
    newInstanceArgs: [],
    deployEvent: 'DeployDao',
  })

  expect(isAddress(daoAddress)).toBe(true)
})

test('Deploys DAO with template with custom newInstance method and args', async () => {
  const { web3 } = context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('membership-template'),
    { ensRegistryAddress: ens },
    'latest'
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

  expect(isAddress(daoAddress)).toBe(true)
})

test('Throws with invalid newInstance', async () => {
  const { web3 } = context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    { ensRegistryAddress: ens },
    'latest'
  )

  try {
    await newDao({
      repo,
      web3,
      newInstanceMethod: 'invalid',
      newInstanceArgs: [],
      deployEvent: 'DeployDao',
    })
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {}
})

test('Throws with invalid deploy event', async () => {
  const { web3 } = context

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    { ensRegistryAddress: ens },
    'latest'
  )

  try {
    await newDao({
      repo,
      web3,
      newInstanceMethod: 'newInstance',
      newInstanceArgs: [],
      deployEvent: 'invalid',
    })
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {}
})
