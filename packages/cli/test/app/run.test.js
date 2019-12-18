import test from 'ava'
import path from 'path'
import execa from 'execa'
import { startProcess, getBinary, getPackageRoot } from '@aragon/toolkit'

const RUN_CMD_TIMEOUT = 1800000 // 3min

const testSandbox = './.tmp/run'

const mockappPath = path.resolve('./test/mock')

const cliPath = '../../dist/cli.js'

test.serial('should run an aragon app successfully on IPFS', async t => {
  const publishDirPath = path.resolve(`${mockappPath}/${testSandbox}/ipfs`)

  const { kill } = await startProcess({
    cmd: 'node',
    args: [cliPath, 'run', '--files', 'dist', '--publish-dir', publishDirPath],
    execaOpts: {
      cwd: mockappPath,
      localDir: '.',
      detached: true,
    },
    readyOutput: 'Open http://localhost:',
    timeout: RUN_CMD_TIMEOUT,
  })

  // cleanup
  await kill()

  t.pass()
})

test.serial(
  'should run an aragon app successfully on IPFS using a Template',
  async t => {
    const publishDirPath = path.resolve(
      `${mockappPath}/${testSandbox}/ipfs-template`
    )

    const { kill } = await startProcess({
      cmd: 'node',
      args: [
        cliPath,
        'run',
        '--files',
        'dist',
        '--publish-dir',
        publishDirPath,
        // Template args
        '--template',
        'Template',
        '--template-init',
        '0x5d94e3e7aec542ab0f9129b9a7badeb5b3ca0f77',
        '@ARAGON_ENS',
        '0xd526b7aba39cccf76422835e7fd5327b98ad73c9',
        '0xf1f8aac64036cdd399886b1c157b7e3b361093f3',
        '--template-new-instance',
        'newTokenAndInstance',
        '--template-args',
        'MyToken',
        'TKN',
        '["0xb4124cEB3451635DAcedd11767f004d8a28c6eE7"]',
        '["1000000000000000000"]',
        '["500000000000000000","150000000000000000","86400"]',
      ],
      execaOpts: {
        cwd: mockappPath,
        localDir: '.',
        detached: true,
      },
      readyOutput: 'Open http://localhost:',
      timeout: RUN_CMD_TIMEOUT,
    })

    // cleanup
    await kill()

    t.pass()
  }
)

test.serial('should run an aragon app successfully on HTTP', async t => {
  const publishDirPath = path.resolve(`${mockappPath}/${testSandbox}/http`)
  const appPort = 8001

  // start app server
  const packageRoot = getPackageRoot(__dirname)
  const bin = getBinary('http-server', packageRoot)
  const serverProcess = execa(bin, ['dist', '-p', appPort], {
    cwd: mockappPath,
  }).catch(err => {
    throw new Error(err)
  })

  const { kill } = await startProcess({
    cmd: 'node',
    args: [
      cliPath,
      'run',
      '--http',
      `localhost:${appPort}`,
      '--http-served-from',
      './dist',
      '--publish-dir',
      publishDirPath,
    ],
    execaOpts: {
      cwd: mockappPath,
      localDir: '.',
      detached: true,
    },
    readyOutput: 'Open http://localhost:',
    timeout: RUN_CMD_TIMEOUT,
  })

  // cleanup
  await kill()
  await serverProcess.kill('SIGTERM', {
    forceKillAfterTimeout: 2000,
  })

  t.pass()
})

test.serial(
  'should run an aragon app successfully on HTTP using a Template',
  async t => {
    const publishDirPath = path.resolve(
      `${mockappPath}/${testSandbox}/http-template`
    )
    const appPort = 8001

    // start app server
    const packageRoot = getPackageRoot(__dirname)
    const bin = getBinary('http-server', packageRoot)
    const serverProcess = execa(bin, ['dist', '-p', appPort], {
      cwd: mockappPath,
    }).catch(err => {
      throw new Error(err)
    })

    const { kill } = await startProcess({
      cmd: 'node',
      args: [
        cliPath,
        'run',
        '--http',
        `localhost:${appPort}`,
        '--http-served-from',
        './dist',
        '--publish-dir',
        publishDirPath,
        // Template args
        '--template',
        'Template',
        '--template-init',
        '0x5d94e3e7aec542ab0f9129b9a7badeb5b3ca0f77',
        '@ARAGON_ENS',
        '0xd526b7aba39cccf76422835e7fd5327b98ad73c9',
        '0xf1f8aac64036cdd399886b1c157b7e3b361093f3',
        '--template-new-instance',
        'newTokenAndInstance',
        '--template-args',
        'MyToken',
        'TKN',
        '["0xb4124cEB3451635DAcedd11767f004d8a28c6eE7"]',
        '["1000000000000000000"]',
        '["500000000000000000","150000000000000000","86400"]',
      ],
      execaOpts: {
        cwd: mockappPath,
        localDir: '.',
        detached: true,
      },
      readyOutput: 'Open http://localhost:',
      timeout: RUN_CMD_TIMEOUT,
    })

    // cleanup
    await kill()
    await serverProcess.kill('SIGTERM', {
      forceKillAfterTimeout: 2000,
    })

    t.pass()
  }
)
