import test from 'ava'
//
import { getAppPermissions } from '../../../src/dao/acl/getAppPermissions'
import newDao from '../../../src/dao/newDao'

test.beforeEach(async t => {
  t.context = {
    dao: await newDao(),
  }
})

// TODO: This tests is not fetching the apps array right
// assert
test('Should get permissions and apps for a new dao using the wrapper', async t => {
  // arrange
  const { dao } = t.context

  // act

  const { permissions, apps } = await getAppPermissions(dao)

  const roles = Object.values(permissions)

  t.snapshot(
    apps.map(app => app.appName),
    'Should return the correct apps'
  )

  t.snapshot(roles, 'Should return the correct roles')
})
