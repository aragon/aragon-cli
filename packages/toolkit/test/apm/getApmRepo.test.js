import test from 'ava'
//
import getApmRepo from '../../src/apm/getApmRepo'

let info

const apmRepoVersion = '1.0.0'

/* Setup and cleanup */

test.before('setup and make a successful call', async () => {
  const apmRepoName = 'voting'

  info = await getApmRepo(apmRepoName, apmRepoVersion)
})

/* Tests */

test('produces extected info', t => {
  t.is(info.contractAddress, '0xb31E9e3446767AaDe9E48C4B1B6D13Cc6eDce172')
  t.is(info.version, apmRepoVersion)
})
