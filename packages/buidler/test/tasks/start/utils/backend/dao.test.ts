import { assert } from 'chai'
import { createDao } from '~/src/tasks/start/utils/backend/dao'
import { isAddress } from '~/test/test-helpers/isAddress'
import { KernelInstance } from '~/typechain'
import * as bre from '@nomiclabs/buidler'

describe('dao.ts', () => {
  describe('when a dao is created', () => {
    let dao: KernelInstance

    before('create a dao', async () => {
      dao = await createDao(bre.web3)
    })

    it('deploys a dao with a valid address', () => {
      assert.equal(isAddress(dao.address), true, 'Invalid contract address.')
    })

    it('has a valid ACL', async () => {
      assert.equal(isAddress(await dao.acl()), true, 'Invalid acl address.')
    })

    it('has been initialized', async () => {
      assert.equal(await dao.hasInitialized(), true, 'DAO not initialized.')
    })
  })

  it.skip('more tests needed', async () => {})
})
