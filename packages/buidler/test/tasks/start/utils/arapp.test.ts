import { assert } from 'chai'
import {
  getMainContractName,
  getMainContractPath
} from '~/src/tasks/start/utils/arapp'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('arapp.ts', function() {
  useDefaultEnvironment()

  it('should retrieve the correct main contract path', function() {
    assert.equal(
      getMainContractPath(),
      'contracts/Counter.sol',
      'Incorrect main contract path.'
    )
  })

  it('should retrieve the correct main contract name', function() {
    assert.equal(getMainContractName(), 'Counter')
  })
})
