import test from 'ava'
//
import { assignId, isIdAssigned } from '../../src/dao/assign-id'
import { getLocalWeb3, getApmOptions } from '../test-helpers'

let web3
let ensRegistry
let daoAddress, daoId

/* Setup and cleanup */

test.before('setup and successful call', async (t) => {
  web3 = await getLocalWeb3()

  daoAddress = (await web3.eth.getAccounts())[2]

  const apmOptions = getApmOptions()

  ensRegistry = apmOptions.ensRegistryAddress

  daoId = `thedao${new Date().getTime()}`
  await assignId(daoAddress, daoId, { web3, ensRegistry })
})

/* Tests */

test('isIdAssigned returns false for an id that was not set', async (t) => {
  t.false(await isIdAssigned('unassigned', { web3, ensRegistry }))
})

test('isIdAssigned returns true for an id that was set', async (t) => {
  t.true(await isIdAssigned(daoId, { web3, ensRegistry }))
})

test('assignId throws when tyring to re-assign the same address', async (t) => {
  await t.throwsAsync(assignId(daoAddress, daoId, { web3, ensRegistry }), {
    message: /VM Exception while processing transaction/,
  })
})

test('assignId throws when called with an invalid address', async (t) => {
  await t.throwsAsync(
    assignId('INVALID ADDRESS', 'id', { web3, ensRegistry }),
    { message: /Invalid address/ }
  )
})
