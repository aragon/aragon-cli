import test from 'ava'
import sinon from 'sinon'
//
import { getApmRegistryPackages } from '../../src/apm'

let progressHandler
let packages

const apmRegistryName = 'aragonpm.eth'

/* Setup and cleanup */

test.before('setup and make a successful call', async () => {
  progressHandler = sinon.spy()

  packages = await getApmRegistryPackages(apmRegistryName, progressHandler)
})

/* Tests */

test('contains expected packages', t => {
  const names = packages.map(p => p.name)

  t.true(names.includes('finance'))
  t.true(names.includes('voting'))
  t.true(names.includes('agent'))
  t.true(names.includes('company-template'))
  t.true(names.includes('apm-registry'))
})

test('properly calls the progressHandler', t => {
  t.is(progressHandler.callCount, 2)
  t.true(progressHandler.getCall(0).calledWith(1))
  t.true(progressHandler.getCall(1).calledWith(2))
})
