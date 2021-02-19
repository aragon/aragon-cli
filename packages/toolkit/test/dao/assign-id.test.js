import { assignId, isIdAssigned } from '../../src/dao/assign-id'
import { getLocalWeb3, getApmOptions } from '../test-helpers'

let web3
let ensRegistry
let daoAddress, daoId

/* Setup and cleanup */
jest.setTimeout(60000)
beforeAll(async () => {
  web3 = await getLocalWeb3()

  daoAddress = (await web3.eth.getAccounts())[2]

  const apmOptions = getApmOptions()

  ensRegistry = apmOptions.ensRegistryAddress

  daoId = `thedao${new Date().getTime()}`
  await assignId(daoAddress, daoId, { web3, ensRegistry })
})

/* Tests */

test('isIdAssigned returns false for an id that was not set', async () => {
  expect(await isIdAssigned('unassigned', { web3, ensRegistry })).toBe(false)
})

test('isIdAssigned returns true for an id that was set', async () => {
  expect(await isIdAssigned(daoId, { web3, ensRegistry })).toBe(true)
})

test('assignId throws when tyring to re-assign the same address', async () => {
  try {
    await assignId(daoAddress, daoId, { web3, ensRegistry })
    fail('it should not reach here')
  } catch (error) {
    expect(
      error.toString().includes('VM Exception while processing transaction')
    ).toBe(true)
  }
})

test('assignId throws when called with an invalid address', async () => {
  try {
    await assignId('INVALID ADDRESS', 'id', { web3, ensRegistry })
    fail('it should not reach here')
  } catch (error) {
    expect(error.toString().includes('Invalid address')).toBe(true)
  }
})
