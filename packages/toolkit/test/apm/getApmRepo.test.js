import test from 'ava'
//
import { getApmRepo } from '../../src/apm'

test('Fetches info of an APM repo', async t => {
  const apmRepoName = 'voting'
  const apmRepoVersion = '1.0.0'

  const info = await getApmRepo(apmRepoName, apmRepoVersion, '')
  t.is(info.contractAddress, '0xb31E9e3446767AaDe9E48C4B1B6D13Cc6eDce172')
  t.is(info.version, apmRepoVersion)
})
