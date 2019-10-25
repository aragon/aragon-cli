import test from 'ava'
import { from } from 'rxjs'
import sinon from 'sinon'
import { initAragonJS, getTransactionPath, getApps } from '../../src/helpers/aragonjs-wrapper'


test('getApps returns the correct app list', async t => {
  t.plan(1)

  const apps = [{ appId: '0x01' }, { appId: '0x02' }, { appId: '0x03' }]

  const wrapperStub = {
    apps: from([apps])
  }

  t.deepEqual(await getApps(wrapperStub), apps)
})

test('getApps waits for more elements if first list contains only 1 app', async t => {
  t.plan(1)

  const apps = [
    [{ appId: '0x01' }],
    [{ appId: '0x01' }, { appId: '0x02' }, { appId: '0x03' }]
  ]

  const wrapperStub = {
    apps: from(apps)
  }

  t.deepEqual(await getApps(wrapperStub), apps[1])
})
