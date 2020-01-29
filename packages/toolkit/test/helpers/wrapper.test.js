import test from 'ava'
//
import newDao from '../../src/dao/new'
import { getInstalledApps } from '../../src/dao/apps'
import defaultAPMName from '../../src/helpers/default-apm'
import { getTransactionPath } from '../../src/dao/permissions'

let dao
let apps

/* Setup */

test.before('setup', async t => {
  dao = await createDAO()

  apps = await getInstalledApps(dao)
})

/* Tests */
test('getApps returns the correct app list', t => {
  const reducedApps = apps.map(app => {
    return { name: app.name, appId: app.appId }
  })

  t.snapshot(reducedApps)
})

test('getTransactionPath provides an expected path', async t => {
  const voting = apps.filter(app => app.name === 'Voting')[0]

  const paths = await getTransactionPath(
    dao,
    voting.proxyAddress,
    'changeSupportRequiredPct',
    ['490000000000000000']
  )

  t.is(paths.length, 3)

  t.true(
    paths[1].description.includes(
      'Creates a vote to execute the desired action'
    )
  )
})

/* Utils */

async function createDAO() {
  return newDao(
    defaultAPMName('membership-template'),
    [
      'Token name',
      'TKN',
      'daoname' + Math.floor(Math.random() * 1000000),
      ['0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'],
      ['500000000000000000', '50000000000000000', '604800'],
      '1296000',
      true,
    ],
    'newTokenAndInstance'
  )
}
