import test from 'ava'
//
import { newDao } from '../../../src/dao/newDao'
import { getAllApps } from '../../../src/dao/kernel/getApps'
import { getBasesNamespace, getAppBase } from '../../../src/dao/kernel/appBase'

let daoAddress = null
let apps = null

/* Config */
// keccak256 hash output of word 'base' (aragon os kernel constant)
const KERNEL_APP_BASES_NAMESPACE =
  '0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f'

// ACL base address
const ACL_BASE_ADDR = '0x5E0816F0f8bC560cB2B9e9C87187BeCac8c2021F'
// EVM script base addres
const EVMSCRIPT_REGISTRY_BASE_ADDR =
  '0x11AE47b3cDba0F43639864025A7951B1EfE1b6A1'

/* Setup */
test.before('setup', async () => {
  daoAddress = await newDao()
  apps = await getAllApps(daoAddress)
})

/* Tests */
test('getBasesNamespace gets the bases namespace from aragon os kernel', async t => {
  const basesNamespace = await getBasesNamespace(daoAddress)
  t.true(KERNEL_APP_BASES_NAMESPACE === basesNamespace)
})

test('getAppBase gets the app base address', async t => {
  const baseAddrACL = await getAppBase(daoAddress, apps[0].appId)
  const baseAddrEVMSCRIPT = await getAppBase(daoAddress, apps[1].appId)
  t.true(baseAddrACL === ACL_BASE_ADDR)
  t.true(baseAddrEVMSCRIPT === EVMSCRIPT_REGISTRY_BASE_ADDR)
})
