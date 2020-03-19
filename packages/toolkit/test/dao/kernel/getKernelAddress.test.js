import test from 'ava'
//
import { newDao } from '../../../src/dao/newDao'
import { getAllApps } from '../../../src/dao/kernel/getApps'
import { getKernelAddress } from '../../../src/dao/kernel/getKernelAddress'

let daoAddress
let apps

/* Setup */

test.before('setup', async () => {
  daoAddress = await newDao()

  apps = await getAllApps(daoAddress)
})

/* Tests */
test('Returns the correct address', async t => {
  const appAddress = apps[0].proxyAddress

  t.is(await getKernelAddress(appAddress), daoAddress)
})
