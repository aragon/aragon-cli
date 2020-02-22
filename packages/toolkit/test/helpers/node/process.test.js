import test from 'ava'
import {
  startProcess,
  getProcessTree,
  killProcessTree,
} from '../../src/node/process'

// test config
const runProcessPath = './test/node/runProcess'
const readyOutput = 'process initialized'
const processTimeout = 10000 // wait 10 second for spawned process to print readyOutput
//
import { startProcess } from '../../../src/helpers/node/process'

test('startProcess should enable detach', async t => {
  const { detach } = await startProcess({
    cmd: 'ls',
    args: ['-l'],
    readyOutput: '.',
    execaOpts: {
      detached: true,
    },
    timeout: 30000,
  })

  detach()
  t.pass()
})

test('startProcess should enable kill', async t => {
  const { kill } = await startProcess({
    cmd: 'ls',
    args: ['-l'],
    readyOutput: '.',
    execaOpts: {
      detached: true,
    },
    timeout: 30000,
  })

  kill()
  t.pass()
})

test('startProcess should support attach', async t => {
  const { attach } = await startProcess({
    cmd: 'ls',
    args: ['-a'],
    readyOutput: '.',
    execaOpts: {
      detached: true,
    },
    timeout: 30000,
  })

  attach()
  t.pass()
})

test('startProcess should throw timeout exception', async t => {
  const processSetup = {
    cmd: 'node',
    args: [runProcessPath],
    timeout: 0, // expect timeout error is thrown
    readyOutput,
  }
  const error = await t.throwsAsync(async () => startProcess(processSetup))
  t.true(error.message.includes('process timed out'))
})

test('startProcess should throw error if subprocess writes on stderr', async t => {
  const processSetup = {
    cmd: 'node',
    args: [runProcessPath, '--errorFlag'], // the process will write to stderr
    timeout: processTimeout,
    readyOutput,
  }
  await t.throwsAsync(async () => startProcess(processSetup))
})

test('startProcess should start a process and reslove after readyOutput is printed', async t => {
  const processSetup = {
    cmd: 'node',
    args: [runProcessPath],
    timeout: processTimeout,
    readyOutput,
  }
  const subprocess = await startProcess(processSetup)
  // ready output must be printed
  t.true(subprocess.output.includes(readyOutput))
  // Process ppid shoud be pid of current process
  t.true(subprocess.output.includes(`ppid: ${process.pid}`))
})

test('getProcessTree should return process tree with correct PID hierarchy', async t => {
  const processSetup = {
    cmd: 'node',
    args: [runProcessPath, '--childs=3'], // will spawn another 3 processes
    timeout: processTimeout,
    readyOutput,
  }
  const subprocess = await startProcess(processSetup) // this will spawn a process which will spawn 3 childs

  // extract the child PID from 'runProcess.js' script output
  const childPid = String(subprocess.output.match(/ pid: (\d+) /)[1])
  const parentPid = String(process.pid)

  // Get the process tree
  const tree = await getProcessTree({ pid: process.pid })

  // Current process should have a direct child with pid = childPid
  t.true(
    tree.filter(node => node.PPID === parentPid && node.PID === childPid)
      .length === 1
  )

  // child process should have also 3 childs
  t.true(tree.filter(node => node.PPID === childPid).length === 3)
})

test('killProcessTree should kill all the childs of a process', async t => {
  const processSetup = {
    cmd: 'node',
    args: [runProcessPath, '--childs=3'], // will spawn another 3 processes
    timeout: processTimeout,
    readyOutput,
  }

  // spawn a subprocess which will spawn another 3 processes
  const subprocess = await startProcess(processSetup)

  // extract the child PID from 'runProcess.js' script output
  const childPid = String(subprocess.output.match(/ pid: (\d+) /)[1])

  // Get the process tree
  let tree = await getProcessTree({ pid: process.pid })
  t.true(tree.filter(node => node.PID === childPid).length === 1) // check that subprocess is created
  t.true(tree.filter(node => node.PPID === childPid).length === 3) // subprocess has 3 childs

  // kill the subprocess
  await killProcessTree({ pid: childPid })

  // Get again the process tree
  tree = await getProcessTree({ pid: process.pid })

  // TODO: check if the subprocess should also be killed?
  // t.true(tree.filter(node => node.PID === childPid).length === 0)

  // the childs of the subprocess should be killed
  t.true(tree.filter(node => node.PPID === childPid).length === 0)

  // kill again should do nothing
  await killProcessTree({ pid: childPid })
})
