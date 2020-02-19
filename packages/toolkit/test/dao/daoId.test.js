import test from 'ava'
//
import { assignDaoId, isDaoIdAssigned } from '../../src/dao/daoId'

let daoAddress, daoId

/* Setup and cleanup */

test.before('setup and successful call', async t => {
  daoAddress = '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb'

  daoId = `thedao${new Date().getTime()}`

  await assignDaoId(daoAddress, daoId)
})

/* Tests */

test('isIdAssigned returns false for an id that was not set', async t => {
  t.false(await isDaoIdAssigned('unassigned'))
})

test('isIdAssigned returns true for an id that was set', async t => {
  t.true(await isDaoIdAssigned(daoId))
})

test('assignId throws when tyring to re-assign the same address', async t => {
  await t.throwsAsync(assignDaoId(daoAddress, daoId), {
    message: /VM Exception while processing transaction/,
  })
})

test('assignId throws when called with an invalid address', async t => {
  await t.throwsAsync(assignDaoId('INVALID ADDRESS', 'id'), {
    message: /Invalid address/,
  })
})
