import { getDaoAddressPermissionsApps } from '../../src/acl/view'
import { getLocalWeb3, getNewDaoAddress } from '../test-helpers'

jest.setTimeout(60000)
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
  ensRegistryAddress: '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1',
  ipfs: ipfsConf,
}

test('Should get formated permissions for a new dao', async () => {
  // arrange
  const dao = await getNewDaoAddress()
  const web3 = await getLocalWeb3()
  // act
  // eslint-disable-next-line
  const { /* permissions, */ apps } = await getDaoAddressPermissionsApps({
    dao,
    web3Provider: web3.currentProvider,
    ipfsConf,
    apm,
  })
  await web3.currentProvider.connection.close()
  // assert
  expect(apps.map((app) => app.appName)).toMatchSnapshot(
    'Should return the correct apps'
  )
  // t.snapshot(
  //   permissions, // .map(permission => permission),
  //   'Probably can snapshot anything about this result2'
  // )
})
