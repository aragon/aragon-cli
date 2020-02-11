import { serial as test } from 'ava'
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

test.before(async () => {
  await initPackage(projectPath)
})

test.after.always(async () => {
  await killProcessOnPort(apiPort)
  await remove(projectPath)
  await remove(repoPath)
})

test('should install go-ipfs in a new project', async t => {
  const result = await installGoIpfs(true, projectPath)
  t.snapshot(result.command, 'should use the correct command')
})

test('should initialize the repository at a custom path', async t => {
  await ensureRepoInitialized(binPath, repoPath)

  t.pass()
})

test('should configure the ports', async t => {
  await setPorts(repoPath, apiPort, gatewayPort, swarmPort)

  t.pass()
})

// eslint-disable-next-line ava/no-skip-test
test.skip('should run the daemon', async t => {
  const { output, detach } = await startLocalDaemon(binPath, repoPath, {
    detached: true,
  })
  detach()
  const daemonRunning = await isLocalDaemonRunning(apiUrl)

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

// eslint-disable-next-line ava/no-skip-test
test.skip('should configure cors & pin artifacts', async t => {
  const httpClient = await getHttpClient(`http://localhost:${apiPort}`)

  await configureCors(httpClient)
  const corsConfigured = await isCorsConfigured(httpClient)
  const hashes = await pinArtifacts(httpClient)

  t.true(corsConfigured)
  t.snapshot(hashes)
})

// eslint-disable-next-line ava/no-skip-test
test.skip('should stop the daemon', async t => {
  await killProcessOnPort(apiPort)
  const daemonRunning = await isLocalDaemonRunning(apiUrl)

  t.false(daemonRunning)
})
