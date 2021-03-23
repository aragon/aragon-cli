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
jest.setTimeout(60000)
beforeAll(async () => {
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

afterAll(async () => {
  await web3.currentProvider.connection.close()
})

/* Tests */

test('contains expected packages', () => {
  const names = packages.map((p) => p.name)

  expect(names.includes('finance')).toBe(true)
  expect(names.includes('voting')).toBe(true)
  expect(names.includes('agent')).toBe(true)
  expect(names.includes('company-template')).toBe(true)
  expect(names.includes('apm-registry')).toBe(true)
})

test('properly calls the progressHandler', () => {
  expect(progressHandler.callCount).toBe(2)
  expect(progressHandler.getCall(0).calledWith(1)).toBe(true)
  expect(progressHandler.getCall(1).calledWith(2)).toBe(true)
})
