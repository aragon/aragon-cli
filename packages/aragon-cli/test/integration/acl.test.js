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

/* eslint-disable-next-line ava/no-skip-test */
test.skip('Should get formated permissions for a dao apps', async t => {
  // arrange
  const { web3, dao } = t.context
  // act
  const result = await getDaoAddressPermissionsApps({
    dao,
    web3Provider: web3.currentProvider,
    ipfsConf,
    apm,
  })
  // assert
  console.log(result)
  // t.snapshot(result, 'Probably can snapshot anything about this result')
})
