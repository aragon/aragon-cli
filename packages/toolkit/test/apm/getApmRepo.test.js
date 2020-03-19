import test from 'ava'
import { getAragenProvider } from '../testHelpers'

import { Repo } from '../../src/apm/repo'

test('Fetches an APM repo version contract info from aragen', async t => {
  const apmRepoName = 'voting'
  const apmRepoVersion = '1.0.0'

  const provider = getAragenProvider()
  const repo = Repo(provider)
  const { version, contractAddress } = await repo.getVersion(
    apmRepoName,
    apmRepoVersion
  )

  t.is(contractAddress, '0xb31E9e3446767AaDe9E48C4B1B6D13Cc6eDce172')
  t.is(version, apmRepoVersion)
})
