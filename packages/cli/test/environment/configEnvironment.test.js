import test from 'ava'
//
import { configEnvironment } from '../../src/lib/environment/configEnvironment'

test('configEnvironment - ignore network', (t) => {
  const config = configEnvironment({
    ignoreNetwork: true,
  })
  t.deepEqual(config.network, {}, 'networkObj should be empty')
})

test('configEnvironment - with frame', (t) => {
  const config = configEnvironment({
    useFrame: true,
  })
  t.is(config.network.name, 'frame-rpc', 'Wrong network name')
})

test('configEnvironment - with frame on rinkeby', (t) => {
  const config = configEnvironment({
    useFrame: true,
    environment: 'aragon:rinkeby',
  })
  t.is(config.network.name, 'frame-rinkeby', 'Wrong network name')
})

test('configEnvironment - default networks - localhost', (t) => {
  const config = configEnvironment({
    environment: '',
    arapp: { environments: { default: { network: 'rpc' } } },
  })
  t.is(config.network.name, 'rpc', 'Wrong network name')
  t.is(
    config.network.provider.connection._url,
    'ws://localhost:8545',
    'Wrong network provider WS url'
  )
})

test('configEnvironment - default networks - rinkeby', (t) => {
  const config = configEnvironment({
    environment: 'rinkeby',
    arapp: { environments: { rinkeby: { network: 'rinkeby' } } },
  })
  t.is(config.network.name, 'rinkeby', 'Wrong network name')
})

const customEnvironment = 'custom-environment'
const arapp = {
  environments: {
    [customEnvironment]: {
      registry: '0xfe03625ea880a8cba336f9b5ad6e15b0a3b5a939',
      appName: 'aragonnft.open.aragonpm.eth',
      network: 'rinkeby',
    },
    mainnet: {
      registry: '0x314159265dd8dbb310642f98f50c066173c1259b',
      appName: 'aragonnft.open.aragonpm.eth',
      network: 'mainnet',
      wsRPC: 'ws://my.ethchain.dnp.dappnode.eth:8546',
    },
  },
}

test('configEnvironment - custom environment - rinkeby', (t) => {
  const config = configEnvironment({
    environment: customEnvironment,
    arapp,
  })

  const selectedEnv = arapp.environments[customEnvironment]
  t.is(config.network.name, selectedEnv.network, 'Wrong network name')
  t.is(
    config.apm.ensRegistryAddress,
    selectedEnv.registry,
    'Wrong registry address'
  )
  t.is(
    config.wsProvider.connection._url,
    'wss://rinkeby.eth.aragon.network/ws',
    'Wrong network provider WS url'
  )
})
