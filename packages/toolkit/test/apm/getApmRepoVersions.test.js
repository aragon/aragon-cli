import test from 'ava'
//
import { getAllVersions } from '../../src/apm'

test('retrieves the expected versions info', async t => {
  const apmRepoName = 'voting.aragonpm.eth'

  const versions = await getAllVersions(apmRepoName, '')

  t.is(versions.length, 1)

  const version = versions[0]
  t.is(version.version, '1.0.0')

  t.pass()
})
