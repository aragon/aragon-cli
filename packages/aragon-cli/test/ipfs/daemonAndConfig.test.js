import { serial as test } from 'ava'
// import { remove, ensureDir } from 'fs-extra'
//
import {
  startLocalDaemon,
  ensureRepoInitialized,
  setPorts,
  isLocalDaemonRunning,
  isCorsConfigured,
  getClient,
  pinArtifacts,
  configureCors,
} from '../../src/lib/ipfs'
import { installGoIpfs } from '../../src/lib/ipfs/install'
import { initPackage } from '../../src/lib/node/packages'
import { killProcessOnPort } from '../../src/lib/node'

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

test.before(async () => {
  await initPackage(projectPath)
})

test.after.always(async () => {
  await killProcessOnPort(apiPort)
  // await remove(projectPath)
  // await remove(repoPath)
})

test('should install go-ipfs in a new project', async t => {
  // act
  const result = await installGoIpfs(true, projectPath)
  // assert
  t.snapshot(result.cmd, 'should use the correct command')
})

test('should initialize the repository at a custom path', async t => {
  // act
  await ensureRepoInitialized(binPath, repoPath)
  // assert
  t.pass()
})

test('should configure the ports', async t => {
  // act
  await setPorts(repoPath, apiPort, gatewayPort, swarmPort)
  // assert
  t.pass()
})

test('should run the daemon', async t => {
  // act
  const { output, detach } = await startLocalDaemon(binPath, repoPath, {
    detached: true,
  })
  detach()
  const daemonRunning = await isLocalDaemonRunning(apiUrl)
  // assert
  t.true(daemonRunning)
  t.true(output.includes('Daemon is ready'))
  t.true(output.includes(`API server listening on /ip4/0.0.0.0/tcp/${apiPort}`))
  t.true(output.includes(`WebUI: http://0.0.0.0:${apiPort}/webui`))
  t.true(output.includes(`Swarm listening on /ip4/127.0.0.1/tcp/${swarmPort}`))
  t.true(output.includes(`Swarm announcing /ip4/127.0.0.1/tcp/${swarmPort}`))
  t.true(
    output.includes(
      `Gateway (readonly) server listening on /ip4/0.0.0.0/tcp/${gatewayPort}`
    )
  )
})

test('should configure cors & pin artifacts', async t => {
  // arrange
  const apiClient = await getClient(`http://localhost:${apiPort}`)
  // act
  await configureCors(apiClient)
  const corsConfigured = await isCorsConfigured(apiClient)
  const hashes = await pinArtifacts(apiClient)
  // assert
  t.true(corsConfigured)
  t.snapshot(hashes)
})

test('should stop the daemon', async t => {
  // act
  await killProcessOnPort(apiPort)
  const daemonRunning = await isLocalDaemonRunning(apiUrl)
  // assert
  t.false(daemonRunning)
})
