import test from 'ava'
//
import newDao from '../../../src/dao/new'
import { getAllApps } from '../../../src/dao/kernel/apps'
import getAppKernel from '../../../src/dao/kernel/getAppKernel'

let daoAddress
let apps

/* Setup */

test.before('setup', async t => {
  daoAddress = await newDao()

  apps = await getAllApps(daoAddress)
})

/* Tests */
test('Returns the correct address', async t => {
  const appAddress = apps[0].proxyAddress

  t.is(await getAppKernel(appAddress), daoAddress)
})
