import { remove } from 'fs-extra'
import {
  startLocalDaemon,
  ensureRepoInitialized,
  setPorts,
  isLocalDaemonRunning,
  isCorsConfigured,
  getHttpClient,
  pinArtifacts,
  configureCors,
  installGoIpfs,
} from '../../src/ipfs'
import { initPackage, killProcessOnPort } from '../../src/node'

const apiPort = 8010
const gatewayPort = 8011
const swarmPort = 8012

const apiUrl = {
  protocol: 'http',
  host: 'localhost',
  port: apiPort,
}

const projectPath = './.tmp/ipfs-tests/project'
const repoPath = './.tmp/ipfs-tests/repo'
const binPath = './.tmp/ipfs-tests/project/node_modules/.bin/ipfs'

jest.setTimeout(160000)
beforeAll(async () => {
  await initPackage(projectPath)
})

test('should install go-ipfs in a new project', async () => {
  const result = await installGoIpfs(true, projectPath)
  expect(result.command).toMatchSnapshot('should use the correct command')
})

test('should initialize the repository at a custom path', async () => {
  await ensureRepoInitialized(binPath, repoPath)
})

test('should configure the ports', async () => {
  await setPorts(repoPath, apiPort, gatewayPort, swarmPort)
})

test.skip('should run the daemon', async () => {
  const { output, detach } = await startLocalDaemon(binPath, repoPath, {
    detached: true,
  })
  detach()
  const daemonRunning = await isLocalDaemonRunning(apiUrl)

  expect(daemonRunning).toBe(true)
  expect(output.includes('Daemon is ready')).toBe(true)
  expect(
    output.includes(`API server listening on /ip4/0.0.0.0/tcp/${apiPort}`)
  ).toBe(true)
  expect(output.includes(`WebUI: http://0.0.0.0:${apiPort}/webui`)).toBe(true)
  expect(
    output.includes(`Swarm listening on /ip4/127.0.0.1/tcp/${swarmPort}`)
  ).toBe(true)
  expect(
    output.includes(`Swarm announcing /ip4/127.0.0.1/tcp/${swarmPort}`)
  ).toBe(true)
  expect(
    output.includes(
      `Gateway (readonly) server listening on /ip4/0.0.0.0/tcp/${gatewayPort}`
    )
  ).toBe(true)
})

test.skip('should configure cors & pin artifacts', async () => {
  const httpClient = await getHttpClient(`http://localhost:${apiPort}`)

  await configureCors(httpClient)
  const corsConfigured = await isCorsConfigured(httpClient)
  const hashes = await pinArtifacts(httpClient)

  expect(corsConfigured).toBe(true)
  expect(hashes).toMatchSnapshot()
})

test.skip('should stop the daemon', async () => {
  await killProcessOnPort(apiPort)
  const daemonRunning = await isLocalDaemonRunning(apiUrl)

  expect(daemonRunning).toBe(false)
})

test('kill process and remove project paths...', async () => {
  await killProcessOnPort(apiPort)
  await remove(projectPath)
  await remove(repoPath)
})
