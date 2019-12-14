import test from 'ava'
//
import getApmRepoVersions from '../../src/apm/getApmRepoVersions'
import { getLocalWeb3, getApmOptions } from '../test-helpers'

let web3
let apmOptions, apmRepoName
let versions

/* Setup and cleanup */

test.before('setup and make a successful call', async t => {
  web3 = await getLocalWeb3()

  apmOptions = getApmOptions()
  apmRepoName = 'voting.aragonpm.eth'

  versions = await getApmRepoVersions(web3, apmRepoName, apmOptions)
})

test('retrieves the expected versions info', t => {
  t.is(versions.length, 1)

  const version = versions[0]
  t.is(version.name, 'Voting')
  t.is(version.version, '1.0.0')

  t.pass()
})

test('fails if apmOptions does not contain an ens-registry property', async t => {
  const emptyApmOptions = {}

  const error = await t.throwsAsync(async () => {
    await getApmRepoVersions(web3, apmRepoName, emptyApmOptions)
  })

  t.is(error.message, 'ens-registry not found in given apm options.')
})
