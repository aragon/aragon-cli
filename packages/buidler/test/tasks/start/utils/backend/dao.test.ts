import { assert } from 'chai'
import { createDao } from '~/src/tasks/start/utils/backend/dao'
import { isAddress } from '~/test/test-helpers/isAddress'
import { KernelInstance } from '~/typechain'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('dao.ts', function() {
  useDefaultEnvironment()

  describe('when a dao is created', function() {
    let dao: KernelInstance

    before('create a dao', async function() {
      dao = await createDao(this.env.web3, this.env.artifacts)
    })

    it('deploys a dao with a valid address', function() {
      assert.equal(isAddress(dao.address), true, 'Invalid contract address.')
    })

    it('has a valid ACL', async function() {
      assert.equal(isAddress(await dao.acl()), true, 'Invalid acl address.')
    })

    it('has been initialized', async function() {
      assert.equal(await dao.hasInitialized(), true, 'DAO not initialized.')
    })
  })

  it.skip('more tests needed', async function() {})
})
