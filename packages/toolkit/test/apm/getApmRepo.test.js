import test from 'ava'
//
import defaultAPMName from '../../src/helpers/default-apm'
import getApm from '../../src/apm/apm'

let apmRepoName
let info

const apmRepoVersion = '1.0.0'

/* Setup and cleanup */

test.before('setup and make a successful call', async t => {
  const apm = await getApm()

  apmRepoName = defaultAPMName('voting')

  info = await apm.getVersion(apmRepoName, apmRepoVersion.split('.'))
})

/* Tests */

test('produces extected info', t => {
  t.is(info.contractAddress, '0xb31E9e3446767AaDe9E48C4B1B6D13Cc6eDce172')
  t.is(info.version, apmRepoVersion)
})
