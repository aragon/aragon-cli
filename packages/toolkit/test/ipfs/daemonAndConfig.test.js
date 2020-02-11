import { serial as test } from 'ava'
import { join as pathJoin } from 'path'
import { existsSync, appendFileSync } from 'fs'
import { readJson, writeJson, remove } from 'fs-extra'

import {
  getBinaryPath,
  startLocalDaemon,
  ensureRepoInitialized,
  setPorts,
  isLocalDaemonRunning,
  isCorsConfigured,
  getHttpClient,
  pinArtifacts,
  configureCors,
  installGoIpfs,
  getRepoSize,
  getRepoConfig,
  patchRepoConfig,
  getDefaultRepoPath,
  ensureLocalDaemon,
} from '../../src/ipfs'
import { initPackage, killProcessOnPort } from '../../src/node'

const apiPort = 8910
const gatewayPort = 8911
const swarmPort = 8912

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

test('should get the ipfs binary', t => {
  const rootDir = process.cwd()
  process.chdir(projectPath) // change cwd to project directory
  const result = getBinaryPath()
  process.chdir(rootDir) // change back cwd to root directory (required for follwing tests)
  t.true(result.includes('/ipfs'))
})

test('should throw error if binPath is invalid or null', async t => {
  await t.throwsAsync(async () => ensureRepoInitialized(null, repoPath))
  await t.throwsAsync(async () =>
    ensureRepoInitialized('invalid_ipfs_bin_path', repoPath)
  )
})

test('should initialize the repository at a custom path', async t => {
  t.false(existsSync(repoPath))
  await ensureRepoInitialized(binPath, repoPath)
  t.true(existsSync(repoPath))
  t.true(existsSync(pathJoin(repoPath, 'config')))
})

test('should throw error if binPath/repoPath is null or invalid', async t => {
  await t.throwsAsync(async () => startLocalDaemon(null, repoPath, {}))
  // TODO: investigate why test PASSES but unhandled rejection is thrown by following line:
  // await t.throwsAsync(async () => startLocalDaemon('invalid_bin', repoPath, {}))
  await t.throwsAsync(async () => startLocalDaemon(binPath, null, {}))
  await t.throwsAsync(async () => startLocalDaemon(binPath, 'invalid_path', {}))
})

test('should get ipfs config', async t => {
  await t.throwsAsync(async () => getRepoConfig('invalid_path'))

  const config = await getRepoConfig(repoPath)
  t.true('Identity' in config)
  t.true('PeerID' in config.Identity)
  t.true('PrivKey' in config.Identity)
})

test('should configure the ports', async t => {
  await setPorts(repoPath, apiPort, gatewayPort, swarmPort)
  t.pass()
})

test('should run the daemon', async t => {
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

test('should throw cors is not configured error', async t => {
  const httpClient = await getHttpClient(`http://localhost:${apiPort}`)
  const err = await t.throwsAsync(async () => isCorsConfigured(httpClient))
  t.true(err.message.includes('Access-Control-Allow-Origin: *'))
  t.true(err.message.includes('Access-Control-Allow-Methods: PUT,GET,POST'))
})

test('should configure cors & pin artifacts', async t => {
  const httpClient = await getHttpClient(`http://localhost:${apiPort}`)

  await configureCors(httpClient)
  const corsConfigured = await isCorsConfigured(httpClient)
  const hashes = await pinArtifacts(httpClient)

  t.true(corsConfigured)
  t.snapshot(hashes)
})

test('should get folder correct object with size', async t => {
  const result = await getRepoSize(repoPath)
  t.true('value' in result)
  t.true('unit' in result)
  t.true('long' in result)
  t.true(!isNaN(parseFloat(result.value)))
})

test('should throw error if input folder is invalid', async t => {
  await t.throwsAsync(async () => getRepoSize('invalid_repo_path'))
  // TODO: getRepoSize returns size even on files, check if input path is folder or rename function
  // await t.throwsAsync(async () => getRepoSize('package.json'))
})

test('should stop the daemon', async t => {
  await killProcessOnPort(apiPort)
  const daemonRunning = await isLocalDaemonRunning(apiUrl)
  t.false(daemonRunning)
})

test('should return false if port is not taken', async t => {
  const portTaken = await isLocalDaemonRunning(apiUrl)
  t.false(portTaken)
})

test('patchRepoConfig should add/update new key in ipfs config file', async t => {
  const patch = {
    testPatchKey1: 'testPatchValue1',
    testPatchKey2: 'testPatchValue2',
  }
  const nextConfig = await patchRepoConfig(repoPath, patch)
  t.true('testPatchKey1' in nextConfig)
  t.true('testPatchKey2' in nextConfig)
  t.true(nextConfig.testPatchKey1 === 'testPatchValue1')
  t.true(nextConfig.testPatchKey2 === 'testPatchValue2')
})

test('patchRepoConfig should throw error if repoPath or config is invalid', async t => {
  await t.throwsAsync(async () => patchRepoConfig('invalid_repo_path', {}))

  // invalidate the config file
  appendFileSync(pathJoin(repoPath, 'config'), 'config becomes invalid!')
  await t.throwsAsync(async () => patchRepoConfig(repoPath, {}))
})

test('should return default location of ipfs repository', t => {
  const result = getDefaultRepoPath()
  t.true(result.includes('/home'))
  t.true(result.includes('.ipfs'))
})

test('ensureLocalDaemon will init project and ipfs repo, after will start the daemon', async t => {
  await remove(projectPath)
  await remove(repoPath)

  await ensureLocalDaemon({
    projectPath,
    binPath,
    repoPath,
    apiPort,
    gatewayPort,
    swarmPort,
  })

  // test if project and repo are initialized
  t.true(existsSync(projectPath))
  t.true(existsSync(binPath))
  t.true(existsSync(repoPath))
  t.true(existsSync(pathJoin(projectPath, 'package.json')))
  t.true(existsSync(pathJoin(repoPath, 'config')))

  // test if package.json has dependency go-ipfs
  const projectPackage = await readJson(pathJoin(projectPath, 'package.json'))
  t.true('go-ipfs' in projectPackage.dependencies)

  // test if daemon started
  t.true(await isLocalDaemonRunning(apiUrl))
})

test('ensureLocalDaemon will not overwrite package.json, and ipfs config', async t => {
  const projectPackagePath = pathJoin(projectPath, 'package.json')
  // add content into package.json and ipfs config
  const repoConfig = await patchRepoConfig(repoPath, { newField: 'newValue' })
  const projectPackage = await readJson(projectPackagePath)
  projectPackage.newField = 'newValue'
  projectPackage.dependencies['some-npm-package'] = '^1.0.0'
  await writeJson(projectPackagePath, projectPackage, { spaces: 2 })

  await ensureLocalDaemon({
    projectPath,
    binPath,
    repoPath,
    apiPort,
    gatewayPort,
    swarmPort,
  })

  // test if added content was not overwritten
  t.deepEqual(projectPackage, await readJson(projectPackagePath))
  t.deepEqual(repoConfig, await getRepoConfig(repoPath))
})
