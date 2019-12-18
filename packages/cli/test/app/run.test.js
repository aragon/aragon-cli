import test from 'ava'
import path from 'path'
import { startProcess } from '@aragon/toolkit'

const RUN_CMD_TIMEOUT = 1800000 // 3min

const testSandbox = './.tmp/run'

const mockappPath = path.resolve('./test/mock')

const cliPath = '../../dist/cli.js'

test('should run an aragon app successfully on IPFS', async t => {
  // arrange
  const publishDirPath = path.resolve(`${mockappPath}/${testSandbox}`)

  // act
  const { kill } = await startProcess({
    cmd: 'node',
    args: [cliPath, 'run', '--files', 'app', '--publish-dir', publishDirPath],
    execaOpts: {
      cwd: mockappPath,
      localDir: '.',
    },
    readyOutput: 'Opening http://localhost:',
    timeout: RUN_CMD_TIMEOUT,
    logger: console.log,
  })

  // cleanup
  await kill()

  // assert
  t.pass()
})

// test('should run an aragon app successfully on HTTP', async t => {
//   // prepare
//   // TODO: Start app server

//   // act
//   const { kill } = await startProcess({
//     cmd: 'npm',
//     args: ['run', 'start', '--', '--publish-dir', publishDirPath],
//     execaOpts: {
//       localDir: '.',
//     },
//     readyOutput: 'Opening http://localhost:3000/#/',
//     timeout: RUN_CMD_TIMEOUT,
//     logger: console.log,
//   })

//   // cleanup
//   await kill()

//   // assert
//   t.pass()
//   // t.snapshot(fetchResult.status)
//   // t.snapshot(fetchBody)
// })

// test('should run an aragon app successfully on IPFS using a Template', async t => {
//   // prepare
//   // TODO: Start app server

//   // act
//   const { kill } = await startProcess({
//     cmd: 'npm',
//     args: ['run', 'start', '--', '--publish-dir', publishDirPath],
//     execaOpts: {
//       localDir: '.',
//     },
//     readyOutput: 'Opening http://localhost:3000/#/',
//     timeout: RUN_CMD_TIMEOUT,
//     logger: console.log,
//   })

//   // cleanup
//   await kill()

//   // assert
//   t.pass()
//   // t.snapshot(fetchResult.status)
//   // t.snapshot(fetchBody)
// })

// test('should run an aragon app successfully on HTTP', async t => {
//   // prepare
//   // TODO: Start app server

//   // act
//   const { kill } = await startProcess({
//     cmd: 'npm',
//     args: ['run', 'start', '--', '--publish-dir', publishDirPath],
//     execaOpts: {
//       localDir: '.',
//     },
//     readyOutput: 'Opening http://localhost:3000/#/',
//     timeout: RUN_CMD_TIMEOUT,
//     logger: console.log,
//   })

//   // cleanup
//   await kill()

//   // assert
//   t.pass()
//   // t.snapshot(fetchResult.status)
//   // t.snapshot(fetchBody)
// })

// test('should run an aragon app successfully on HTTP using a Template', async t => {
//   // prepare
//   // TODO: Start app server

//   // act
//   const { kill } = await startProcess({
//     cmd: 'npm',
//     args: ['run', 'start', '--', '--publish-dir', publishDirPath],
//     execaOpts: {
//       localDir: '.',
//     },
//     readyOutput: 'Opening http://localhost:3000/#/',
//     timeout: RUN_CMD_TIMEOUT,
//     logger: console.log,
//   })

//   // cleanup
//   await kill()

//   // assert
//   t.pass()
//   // t.snapshot(fetchResult.status)
//   // t.snapshot(fetchBody)
// })

// // TODO:
// // "start": "npm run start:ipfs",
// // "start:ipfs": "aragon run --files dist",
// // "start:http": "aragon run --http localhost:8001 --http-served-from dist",
// // "start:ipfs:template": "aragon run --files dist --template template --template-init 0x5d94e3e7aec542ab0f9129b9a7badeb5b3ca0f77 @ARAGON_ENS 0xd526b7aba39cccf76422835e7fd5327b98ad73c9 0xf1f8aac64036cdd399886b1c157b7e3b361093f3 --template-new-instance newTokenAndInstance --template-args MyToken TKN ['\"0xb4124cEB3451635DAcedd11767f004d8a28c6eE7\"'] ['\"1000000000000000000\"'] ['\"500000000000000000\",\"150000000000000000\",\"86400\"']",
// // "start:http:template": "aragon run --http localhost:8001 --http-served-from dist --template template --template-init 0x5d94e3e7aec542ab0f9129b9a7badeb5b3ca0f77 @ARAGON_ENS 0xd526b7aba39cccf76422835e7fd5327b98ad73c9 0xf1f8aac64036cdd399886b1c157b7e3b361093f3 --template-new-instance newTokenAndInstance --template-args MyToken TKN ['\"0xb4124cEB3451635DAcedd11767f004d8a28c6eE7\"'] ['\"1000000000000000000\"'] ['\"500000000000000000\",\"150000000000000000\",\"86400\"']",
