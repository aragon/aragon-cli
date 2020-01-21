import { assert } from 'chai'
import {
  getMainContractName,
  getMainContractPath
} from '~/src/tasks/start/utils/arapp'

// TODO: These tests need to be run in the context of a sample project.
describe.skip('arapp.ts', () => {
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
