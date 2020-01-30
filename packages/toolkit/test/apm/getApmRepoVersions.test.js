import test from 'ava'
//
import useApm from '../../src/apm/useApm'

let apmRepoName
let versions

/* Setup and cleanup */

test.before('setup and make a successful call', async t => {
  const apm = await useApm()

  apmRepoName = 'voting.aragonpm.eth'

  versions = await apm.getAllVersions(apmRepoName)
})

test('retrieves the expected versions info', t => {
  t.is(versions.length, 1)

  const version = versions[0]
  t.is(version.version, '1.0.0')

  t.pass()
})
