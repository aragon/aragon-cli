import { assert } from 'chai'
import { createDao } from '~/src/tasks/start/utils/backend/dao'
import { deployImplementation } from '~/src/tasks/start/utils/backend/app'
import { createProxy } from '~/src/tasks/start/utils/backend/proxy'
import {
  setAllPermissionsOpenly,
  ANY_ADDRESS
} from '~/src/tasks/start/utils/backend/permissions'
import {
  KernelInstance,
  ACLContract,
  ACLInstance,
  CounterInstance
} from '~/typechain'
import { getAppId } from '~/src/tasks/start/utils/id'

describe('permissions.ts', () => {
  let dao: KernelInstance
  let acl: ACLInstance
  let app: CounterInstance

  before('set up dao with app', async () => {
    dao = await createDao()

    const ACL: ACLContract = artifacts.require('ACL')
    acl = await ACL.at(await dao.acl())

    const implementation = await deployImplementation()
    const appId = getAppId('counter')
    app = (await createProxy(implementation, appId, dao)) as CounterInstance
  })

  describe('when setAllPermissionsOpenly is called', () => {
    before('call setAllPermissionsOpenly', async () => {
      await setAllPermissionsOpenly(dao, app)
    })

    it('properly sets the INCREMENT_ROLE permission', async () => {
      assert.equal(
        await acl.hasPermission(
          ANY_ADDRESS,
          app.address,
          await app.INCREMENT_ROLE()
        ),
        true,
        'Invalid permission.'
      )
    })

    it('properly sets the DECREMENT_ROLE permission', async () => {
      assert.equal(
        await acl.hasPermission(
          ANY_ADDRESS,
          app.address,
          await app.DECREMENT_ROLE()
        ),
        true,
        'Invalid permission.'
      )
    })
  })
})
