import test from 'ava'
//
import { assignId, isIdAssigned } from '../../src/dao/assign-id'

let daoAddress, daoId

/* Setup and cleanup */

test.before('setup and successful call', async t => {
  daoAddress = '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb'

  daoId = `thedao${new Date().getTime()}`

  await assignId(daoAddress, daoId)
})

/* Tests */

test('isIdAssigned returns false for an id that was not set', async t => {
  t.false(await isIdAssigned('unassigned'))
})

test('isIdAssigned returns true for an id that was set', async t => {
  t.true(await isIdAssigned(daoId))
})

test('assignId throws when tyring to re-assign the same address', async t => {
  await t.throwsAsync(assignId(daoAddress, daoId), {
    message: /VM Exception while processing transaction/,
  })
})

test('assignId throws when called with an invalid address', async t => {
  await t.throwsAsync(assignId('INVALID ADDRESS', 'id'), {
    message: /Invalid address/,
  })
})
