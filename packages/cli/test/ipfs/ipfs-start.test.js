import test from 'ava'
import parseCli from '../parseCli'

test.serial.beforeEach(async t => {
  // stop ipfs before each test
  await stopIpfsCommand()
})

test.serial.afterEach(async t => {
  // stop ipfs after each test
  await stopIpfsCommand()
})

test.serial.after(async t => {
  // start the ipfs daemon again, prevent breaking of following tests
  await parseCli(['ipfs', 'start', '--debug', '-D'])
})

test.serial('ipfs start successfully starts daemon', async t => {
  let output = null
  // starting ipfs daemon in background
  output = await parseCli(['ipfs', 'start', '--debug', '-D'])

  // test that ipfs daemon succesfully started
  output = await parseCli(['ipfs', 'status', '--debug'])
  t.assert(output.includes('Daemon: running'))
})

test.serial('ipfs start throws error if daemon already running', async t => {
  // start ipfs daemon
  await parseCli(['ipfs', 'start', '--debug', '-D'])

  // start again ipfs daemon, expect exception is thrown
  await t.throwsAsync(async () => parseCli(['ipfs', 'start', '--debug', '-D']))
})

test.serial('ipfs stop successfully kills the daemon', async t => {
  let output = null
  // starting ipfs daemon in background
  output = await parseCli(['ipfs', 'start', '--debug', '-D'])
  t.assert(output.includes('Daemon is ready'))

  // stop the daemon
  await parseCli(['ipfs', 'stop', '--debug'])

  // test that ipfs is succesfully stopped
  output = await parseCli(['ipfs', 'status', '--debug'])
  t.assert(output.includes('Daemon: stopped'))
})

async function stopIpfsCommand() {
  try {
    await parseCli(['ipfs', 'stop', '--debug'])
  } catch (e) {
    /* We reach here ipfs is already running */
  }
}
