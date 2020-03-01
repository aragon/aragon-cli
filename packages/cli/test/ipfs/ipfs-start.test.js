import test from 'ava'
import { remove } from 'fs-extra'
import parseCli from '../parseCli'
import { initPackage, killProcessOnPort } from '../../src/lib/node'
import { installGoIpfs } from '../../src/lib/ipfs'


// sandbox project with local ipfs
const projectPath = './.tmp/test_cli_ipfs/project'
const repoPath = './.tmp/test_cli_ipfs/repo/'
const binPath = './.tmp/test_cli_ipfs/project/node_modules/.bin/ipfs'

const apiPort = 18080
const swarmPort = 14001
const gatewayPort = 15001

const repoPathOpt = `--repo-path ${repoPath}`
const binPathOpt = `--bin-path ${binPath}`
const apiPortOpt = `--api-port ${apiPort}`
const swarmPortOpt = `--swarm-port ${swarmPort}`
const gatewayPortOpt = `--gateway-port ${gatewayPort}`

test.serial.before(async t => {
  // setup local ipfs
  await initPackage(projectPath)
  await installGoIpfs(true, projectPath)
})

test.serial.beforeEach(async t => {
  // stop local ipfs before each test
  await killProcessOnPort(apiPort)
})

test.serial.afterEach(async t => {
  // stop local ipfs after each test
  await killProcessOnPort(apiPort)
})

test.serial.after.always(async t => {
  // cleanup
  await killProcessOnPort(apiPort)
  await remove(projectPath)
  await remove(repoPath)
})

test.serial('ipfs start successfully starts the daemon', async t => {
  // starting local ipfs daemon in background
  let output = await parseCli(
    `ipfs start --debug -D ${repoPathOpt} ${binPathOpt} ${apiPortOpt} ${swarmPortOpt} ${gatewayPortOpt}`
  )

  t.true(output.includes(`Swarm listening on /ip4/127.0.0.1/tcp/${swarmPort}`))
  t.true(output.includes(`Swarm announcing /ip4/127.0.0.1/tcp/${swarmPort}`))
  t.true(output.includes(`API server listening on /ip4/0.0.0.0/tcp/${apiPort}`))
  t.true(
    output.includes(
      `Gateway (readonly) server listening on /ip4/0.0.0.0/tcp/${gatewayPort}`
    )
  )

  // get the status
  output = await parseCli(`ipfs status --debug  ${repoPathOpt}`)
  t.true(output.includes('Daemon: running'))
})

test.serial('ipfs start throws error if daemon already running', async t => {
  // starting local ipfs daemon in background
  const output = await parseCli(
    `ipfs start --debug -D ${repoPathOpt} ${binPathOpt} ${apiPortOpt} ${swarmPortOpt} ${gatewayPortOpt}`
  )
  t.true(output.includes('Daemon is ready'))

  // start again ipfs daemon, expect exception is thrown
  await t.throwsAsync(async () =>
    parseCli(
      `ipfs start --debug -D ${repoPathOpt} ${binPathOpt} ${apiPortOpt} ${swarmPortOpt} ${gatewayPortOpt}`
    )
  )
})

test.serial('ipfs stop successfully kills the daemon', async t => {
  let output = null
  // starting local ipfs daemon in background
  output = await parseCli(
    `ipfs start --debug -D ${repoPathOpt} ${binPathOpt} ${apiPortOpt} ${swarmPortOpt} ${gatewayPortOpt}`
  )
  t.true(output.includes('Daemon is ready'))

  // stop the daemon
  await parseCli(`ipfs stop --debug ${repoPathOpt}`)

  // test that ipfs is succesfully stopped
  output = await parseCli(`ipfs status --debug ${repoPathOpt}`)
  t.true(output.includes('Daemon: stopped'))
})
