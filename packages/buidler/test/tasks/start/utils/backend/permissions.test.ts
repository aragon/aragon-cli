import { assert } from 'chai'
import { createDao } from '~/src/tasks/start/utils/backend/dao'
import { readArapp } from '~/src/tasks/start/utils/arapp'
import { deployImplementation } from '~/src/tasks/start/utils/backend/app'
import { createProxy } from '~/src/tasks/start/utils/backend/proxy'
import { AragonAppJson } from '~/src/types'
import {
  setAllPermissionsOpenly,
  ANY_ADDRESS
} from '~/src/tasks/start/utils/backend/permissions'
import { KernelInstance, ACLContract, ACLInstance } from '~/typechain'
import { getAppId } from '~/src/tasks/start/utils/id'
import { useDefaultEnvironment } from '~/test/test-helpers/useEnvironment'

describe('permissions.ts', function() {
  useDefaultEnvironment()

  let dao: KernelInstance
  let acl: ACLInstance
  let arapp: AragonAppJson
  let app: any

  before('set up dao with app', async function() {
    dao = await createDao(this.env.web3, this.env.artifacts)

    const ACL: ACLContract = this.env.artifacts.require('ACL')
    acl = await ACL.at(await dao.acl())

    const implementation = await deployImplementation(this.env.artifacts)
    const appId = getAppId('counter')
    app = await createProxy(
      implementation,
      appId,
      dao,
      this.env.web3,
      this.env.artifacts
    )

    arapp = readArapp()
  })

  describe('when setAllPermissionsOpenly is called', function() {
    before('call setAllPermissionsOpenly', async function() {
      await setAllPermissionsOpenly(
        dao,
        app,
        arapp,
        this.env.web3,
        this.env.artifacts
      )
    })

    it('properly sets the INCREMENT_ROLE permission', async function() {
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

    it('properly sets the DECREMENT_ROLE permission', async function() {
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
