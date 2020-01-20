import { assert } from 'chai'
import {
  getMainContractName,
  getMainContractPath
} from '~/src/tasks/start/utils/arapp'

describe('arapp.ts', () => {
  it('should retrieve the correct main contract path', () => {
    assert.equal(
      getMainContractPath(),
      'contracts/Counter.sol',
      'Incorrect main contract path.'
    )
  })

  it('should retrieve the correct main contract name', () => {
    assert.equal(getMainContractName(), 'Counter')
  })
})
