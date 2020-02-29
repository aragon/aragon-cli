import test from 'ava'
//
import { getAppPermissions } from '../../../src/dao/acl/getAppPermissions'
import newDao from '../../../src/dao/newDao'

// TODO: This tests is not fetching the apps array right
// assert
test('Should get permissions and apps for a new dao using the wrapper', async t => {
  // arrange
  const dao = await newDao()

  // act
  const { permissions, apps } = await getAppPermissions(dao)

  // The underlying logic in getAppPermissions is unstable
  // Do not do strict checks until a better approach for getAppPermissions is adopted
  const firstAppName = apps[0].appnName
  t.is(firstAppName, 'kernel.aragonpm.eth', 'Should return the correct apps')

  const roles = Object.values(permissions)
  t.snapshot(roles, 'Should return the correct roles')
})
