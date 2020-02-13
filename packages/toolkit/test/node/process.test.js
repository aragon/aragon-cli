import test from 'ava'
//
import { startProcess } from '../../src/node/process'

test('startProcess should enable detach', async t => {
  const { detach } = await startProcess({
    cmd: 'aragon',
    args: ['--version'],
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
    cmd: 'aragon',
    args: ['--version'],
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
    cmd: 'aragon',
    args: ['--help'],
    readyOutput: 'Usage',
    execaOpts: {
      detached: true,
    },
    timeout: 30000,
  })

  attach()
  t.pass()
})
