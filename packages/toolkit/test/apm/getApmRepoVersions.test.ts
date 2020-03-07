import test from 'ava'
import { getAragenProvider } from '../testHelpers'

import { Repo } from '../../src/apm/repo'

test('Fetches list of all versions of an APM repo from aragen', async t => {
  const apmRepoName = 'voting.aragonpm.eth'

  const provider = getAragenProvider()
  const repo = Repo(provider)
  const versions = await repo.getAllVersions(apmRepoName)

  t.is(versions.length, 1)
  t.is(versions[0].version, '1.0.0')
})
