import sinon from 'sinon'
//
import defaultAPMName from '../../src/helpers/default-apm'
import getApmRepo from '../../src/apm/getApmRepo'
import { getLocalWeb3, getApmOptions } from '../test-helpers'

let web3
let apmOptions, apmRepoName
let progressHandler
let info

const apmRepoVersion = '1.0.0'

/* Setup and cleanup */
jest.setTimeout(60000)
beforeAll(async () => {
  web3 = await getLocalWeb3()

  apmOptions = getApmOptions()
  apmRepoName = defaultAPMName('voting')

  progressHandler = sinon.spy()

  info = await getApmRepo(
    web3,
    apmRepoName,
    apmOptions,
    apmRepoVersion,
    progressHandler
  )
})

/* Tests */

test('produces extected info', () => {
  expect(info.contractAddress).toBe(
    '0xb31E9e3446767AaDe9E48C4B1B6D13Cc6eDce172'
  )
  expect(info.version).toBe(apmRepoVersion)
})

test('properly calls the progressHandler', () => {
  expect(progressHandler.calledTwice).toBe(true)
  expect(progressHandler.getCall(0).calledWith(1)).toBe(true)
  expect(progressHandler.getCall(1).calledWith(2)).toBe(true)
})
