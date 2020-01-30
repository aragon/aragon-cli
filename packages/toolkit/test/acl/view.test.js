import test from 'ava'
//
import { getDaoAddressPermissionsApps } from '../../src/acl/view'
import newDao from '../../src/dao/new'

test.beforeEach(async t => {
  t.context = {
    dao: await newDao(),
  }
})

test('Should get permissions and apps for a new dao using the wrapper', async t => {
  // arrange
  const { dao } = t.context

  // act

  const { permissions, apps } = await getDaoAddressPermissionsApps(dao)

  const roles = Object.values(permissions)

  // assert
  t.snapshot(
    apps.map(app => app.appName),
    'Should return the correct apps'
  )

  t.snapshot(roles, 'Should return the correct roles')
})
