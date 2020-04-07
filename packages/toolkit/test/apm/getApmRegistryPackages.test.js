import test from 'ava'
import sinon from 'sinon'
//
import getApmRegistryPackages from '../../src/apm/getApmRegistryPackages'
import {
  getLocalWeb3,
  getApmRegistryName,
  getApmOptions,
} from '../test-helpers'

let web3
let apmRegistryName, apmOptions
let progressHandler
let packages

/* Setup and cleanup */

test.before('setup and make a successful call', async (t) => {
  web3 = await getLocalWeb3()

  apmRegistryName = getApmRegistryName()
  apmOptions = getApmOptions()

  progressHandler = sinon.spy()

  packages = await getApmRegistryPackages(
    web3,
    apmRegistryName,
    apmOptions,
    progressHandler
  )
})

/* Tests */

test('contains expected packages', (t) => {
  const names = packages.map((p) => p.name)

  t.true(names.includes('finance'))
  t.true(names.includes('voting'))
  t.true(names.includes('agent'))
  t.true(names.includes('company-template'))
  t.true(names.includes('apm-registry'))
})

test('properly calls the progressHandler', (t) => {
  t.is(progressHandler.callCount, 2)
  t.true(progressHandler.getCall(0).calledWith(1))
  t.true(progressHandler.getCall(1).calledWith(2))
})
