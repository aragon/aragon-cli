import { configEnvironment } from '../../src/lib/environment/configEnvironment'

test('configEnvironment - ignore network', () => {
  const config = configEnvironment({
    ignoreNetwork: true,
  })
  expect(config.network).toEqual({})
})

test('configEnvironment - with frame', () => {
  const config = configEnvironment({
    useFrame: true,
  })
  expect(config.network.name).toBe('frame-rpc')
})

test('configEnvironment - with frame on rinkeby', async () => {
  const config = configEnvironment({
    useFrame: true,
    environment: 'aragon:rinkeby',
  })
  expect(config.network.name).toBe('frame-rinkeby')
  await config.wsProvider.connection.close()
})

test('configEnvironment - default networks - localhost', () => {
  const config = configEnvironment({
    environment: '',
    arapp: { environments: { default: { network: 'rpc' } } },
  })
  expect(config.network.name).toBe('rpc')
  expect(config.network.provider.connection._url).toBe('ws://localhost:8545')
})

test('configEnvironment - default networks - rinkeby', async () => {
  const config = configEnvironment({
    environment: 'rinkeby',
    arapp: { environments: { rinkeby: { network: 'rinkeby' } } },
  })
  expect(config.network.name).toBe('rinkeby')
  await config.wsProvider.connection.close()
  config.network.provider.engine.stop()
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
  const config = configEnvironment({
    environment: customEnvironment,
    arapp,
  })

  const selectedEnv = arapp.environments[customEnvironment]
  expect(config.network.name).toBe(selectedEnv.network)
  expect(config.apm.ensRegistryAddress).toBe(selectedEnv.registry)
  expect(config.wsProvider.connection._url).toBe(
    'wss://rinkeby.eth.aragon.network/ws'
  )
  await config.wsProvider.connection.close()
  config.network.provider.engine.stop()
})
