import getApmRepoVersions from '../../src/apm/getApmRepoVersions'
import { getLocalWeb3, getApmOptions } from '../test-helpers'

let web3
let apmOptions, apmRepoName
let versions

/* Setup and cleanup */
jest.setTimeout(60000)
beforeAll(async () => {
  web3 = await getLocalWeb3()

  apmOptions = getApmOptions()
  apmRepoName = 'voting.aragonpm.eth'

  versions = await getApmRepoVersions(web3, apmRepoName, apmOptions)
})

afterAll(async () => {
  await web3.currentProvider.connection.close()
})

test('retrieves the expected versions info', () => {
  expect(versions.length).toBe(1)

  const version = versions[0]
  expect(version.name).toBe('Voting')
  expect(version.version).toBe('1.0.0')
})
