import test from 'ava'
import { isAddress } from 'web3-utils'
//
import newDao from '../../src/dao/newDao'
import getDefaultApmName from '../../src/utils/defaultApm'

test('Deploys DAO with valid template', async t => {
  const daoAddress = await newDao()

  t.true(isAddress(daoAddress))
})

test('Deploys DAO with template with custom newInstance method and args', async t => {
  const daoAddress = await newDao(
    getDefaultApmName('membership-template'),
    [
      'Token name',
      'TKN',
      'daoname' + Math.floor(Math.random() * 1000000),
      ['0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'],
      ['500000000000000000', '50000000000000000', '604800'],
      '1296000',
      true,
    ],
    'newTokenAndInstance'
  )

  t.true(isAddress(daoAddress))
})

test('Throws with invalid newInstance', async t => {
  await t.throwsAsync(newDao('', '', 'invalid'))
})

test('Throws with invalid deploy event', async t => {
  await t.throwsAsync(
    newDao(getDefaultApmName('bare-template'), [], 'newInstance', 'invalid')
  )
})

test('newDao throws if newInstanceMethod does not exist in abi', async t => {
  const error = await t.throwsAsync(() =>
    newDao('bare-template', [], 'undefined_newInstanceMethod')
  )

  t.true(
    error.message.includes(
      'Template abi does not contain the requested function'
    )
  )
})
