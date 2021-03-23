import { configEnvironment } from '../../src/lib/environment/configEnvironment'

let config
afterEach(async () => {
  if (config.wsProvider?.connection) {
    await config.wsProvider.connection.close()
    await config.wsProvider.removeAllListeners()
  }
  if (config.network.provider?.engine) {
    config.network.provider.engine.stop()
  }
})

test('configEnvironment - ignore network', () => {
  config = configEnvironment({
    ignoreNetwork: true,
  })
  expect(config.network).toEqual({})
})

test('configEnvironment - with frame', () => {
  config = configEnvironment({
    useFrame: true,
  })
  expect(config.network.name).toBe('frame-rpc')
})

test('configEnvironment - with frame on rinkeby', async () => {
  config = configEnvironment({
    useFrame: true,
    environment: 'aragon:rinkeby',
  })
  expect(config.network.name).toBe('frame-rinkeby')
})

test('configEnvironment - default networks - localhost', () => {
  config = configEnvironment({
    environment: '',
    arapp: { environments: { default: { network: 'rpc' } } },
  })
  expect(config.network.name).toBe('rpc')
  expect(config.network.provider.connection._url).toBe('ws://localhost:8545')
})

test('configEnvironment - default networks - rinkeby', async () => {
  config = configEnvironment({
    environment: 'rinkeby',
    arapp: { environments: { rinkeby: { network: 'rinkeby' } } },
  })
  expect(config.network.name).toBe('rinkeby')
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

test('configEnvironment - custom environment - rinkeby', async () => {
  config = configEnvironment({
    environment: customEnvironment,
    arapp,
  })

  const selectedEnv = arapp.environments[customEnvironment]
  expect(config.network.name).toBe(selectedEnv.network)
  expect(config.apm.ensRegistryAddress).toBe(selectedEnv.registry)
  expect(config.wsProvider.connection._url).toBe(
    'wss://rinkeby.eth.aragon.network/ws'
  )
})
