import { assert } from 'chai'
import { isAddress } from '~/test/test-helpers/isAddress'
import { deployImplementation } from '~/src/tasks/start/utils/backend/app'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('app.ts', function() {
  useDefaultEnvironment()

  describe('when deploying an implementation of an app', function() {
    let implementation: Truffle.ContractInstance

    before('deploy an implementation of an app', async function() {
      implementation = await deployImplementation(this.env.artifacts)
    })

    it('deploys a contract with a valid address', async function() {
      assert.equal(
        isAddress(implementation.address),
        true,
        'Invalid contract address.'
      )
    })
  })
})
