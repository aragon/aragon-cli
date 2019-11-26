import test from 'ava'
import killProcessOnPort from 'kill-port'
import {
  isIPFSRunning,
  startIPFSDaemon,
  isDaemonRunning,
  startDaemon,
  setIPFSCORS,
  isIPFSCORS,
  getDefaultRepoPath,
  getRepoConfig,
} from '../../../src/lib/ipfs'
import { assertIpfsIsInstalled } from '../test-utils'

const ipfsRpc = {
  protocol: 'http',
  host: 'localhost',
  port: 5001,
}

async function cleanIpfsProcess() {
  try {
    await killProcessOnPort(ipfsRpc.port)
  } catch (e) {
    console.error(`Error killing detached IPFS process: ${e.stack}`)
  }
}

test.before(async () => {
  await assertIpfsIsInstalled()
})

test.beforeEach(async () => {
  await cleanIpfsProcess()
})

test.afterEach(async () => {
  await cleanIpfsProcess()
})

/**
 * Run all tests for the IPFS daemon in the same sequential test() function
 * to ensure there are no collisions.
 * This tests are highly dependant and may be fragile depending on the OS
 * they are run on
 */

// eslint-disable-next-line ava/no-skip-test
test.skip('Sequential IPFS integration test', async t => {
  /**
   * Test startIPFSDaemon, isIPFSRunning (NOT used variant)
   * - Start the IPFS daemon
   * - kill the process
   */
  console.log('Test start IPFS daemon as a detached process')
  t.false(await isIPFSRunning(ipfsRpc), 'IPFS deamon should NOT be running')
  await startIPFSDaemon()
  t.true(await isIPFSRunning(ipfsRpc), 'IPFS deamon should be running')
  await killProcessOnPort(ipfsRpc.port)

  /**
   * Test startDaemon, isDaemonRunning (used variant)
   * - Start IPFS daemon
   * - Leave it running for tests below
   */
  console.log('Test start IPFS daemon')
  t.false(await isDaemonRunning(ipfsRpc), 'IPFS deamon should NOT be running')
  await startDaemon()
  t.true(await isDaemonRunning(ipfsRpc), 'IPFS deamon should be running')

  /**
   * Config IPFS cors
   * - Set IPFS cors params
   * - Check they are set correctly
   */
  console.log('Test IPFS cors config')
  await setIPFSCORS(ipfsRpc)
  const isCorsConfigured = await isIPFSCORS(ipfsRpc)
  t.true(isCorsConfigured, 'isIPFSCORS returned false')
})

/**
 * getRepoConfig fails on linux since the repo path is wrong
 * IPFS config should be manipulated via its HTTP API or via the CLI
 * Postpone test after a discussion on this approach
 */

/* eslint-disable-next-line ava/no-skip-test */
test.skip('Config IPFS ports', async t => {
  //
  const repoPath = getDefaultRepoPath()
  const config = await getRepoConfig(repoPath)
  console.log({ repoPath, config })
})
