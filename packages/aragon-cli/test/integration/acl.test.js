import test from 'ava'
import { getDaoAddressPermissionsApps } from '../../src/lib/acl/view'
import { getLocalWeb3, getNewDaoAddress } from './test-utils'

const ipfsConf = {
  rpc: {
    protocol: 'http',
    host: 'localhost',
    port: 5001,
    default: true,
  },
  gateway: 'http://localhost:8080/ipfs',
}
const apm = {
  'ens-registry': '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1',
  ipfs: ipfsConf,
}

test.beforeEach(async t => {
  t.context = {
    dao: await getNewDaoAddress(),
    web3: await getLocalWeb3(),
  }
})

test('Should get formated permissions for a new dao', async t => {
  // arrange
  const { web3, dao } = t.context
  // act
  // eslint-disable-next-line
  const { /* permissions, */ apps } = await getDaoAddressPermissionsApps({
    dao,
    web3Provider: web3.currentProvider,
    ipfsConf,
    apm,
  })
  // assert
  t.snapshot(
    apps.map(app => app.appName),
    'Should return the correct apps'
  )
  // t.snapshot(
  //   permissions, // .map(permission => permission),
  //   'Probably can snapshot anything about this result2'
  // )
})
