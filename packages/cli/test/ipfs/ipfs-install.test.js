import test from 'ava'
import path from 'path'
import execa from 'execa'
import parseCli from '../parseCli'
import { remove } from 'fs-extra'
import { initPackage } from '@aragon/toolkit'

// config
const projectPath = path.join(process.cwd(), './.tmp/test_cli_ipfs_install/')
const ipfsBinPath = path.join(
  process.cwd(),
  './.tmp/test_cli_ipfs_install/node_modules/.bin/ipfs'
)

const projectPathOpt = `--project-path ${projectPath}`

test.serial.beforeEach(async t => {
  await remove(projectPath)
})

test.serial.after.always(async t => {
  // cleanup
  await remove(projectPath)
})

test.serial(
  'cmd ipfs install --local successfully installs the ipfs binary',
  async t => {
    // create package.json
    await initPackage(projectPath)

    // run the cmd
    let output = await parseCli(
      `ipfs install --debug --local --skip-confirmation ${projectPathOpt}`
    )
    t.true(output.includes(`Location: ${projectPath}`))
    t.true(output.includes('Install IPFS [completed]'))

    // check for ipfs binary
    output = await execa(ipfsBinPath, ['--version'])
    t.true(output.stdout.includes('ipfs version'))
  }
)

test.serial(
  'cmd ipfs install --local throws if error package.json is missing',
  async t => {
    // run the cmd, expect error to be thrown
    await t.throwsAsync(async () =>
      parseCli(
        `ipfs install --debug --local --skip-confirmation ${projectPathOpt}`
      )
    )
  }
)

test.serial(
  'cmd ipfs install --local throws error if ipfs is already installed',
  async t => {
    // create package.json
    await initPackage(projectPath)
    // run the cmd first time
    const output = await parseCli(
      `ipfs install --debug --local --skip-confirmation ${projectPathOpt}`
    )

    t.true(output.includes(`Location: ${projectPath}`))
    t.true(output.includes('Install IPFS [completed]'))

    // run the cmd second time, expect error is thrown
    await t.throwsAsync(async () =>
      parseCli(
        `ipfs install --debug --local --skip-confirmation ${projectPathOpt}`
      )
    )
  }
)

test.serial(
  'cmd ipfs uninstall --local throws error if ipfs is not installed',
  async t => {
    // create package.json
    await initPackage(projectPath)
    // run the cmd, expect error to be thrown
    process.chdir(projectPath)
    await t.throwsAsync(async () =>
      parseCli(`ipfs uninstall --debug --local --skip-confirmation`)
    )
  }
)

test.serial('cmd ipfs uninstall --local successfully remove ipfs', async t => {
  // create package.json
  await initPackage(projectPath)
  // run the install command
  let output = await parseCli(
    `ipfs install --debug --local --skip-confirmation ${projectPathOpt}`
  )

  // check for ipfs binary
  output = await execa(ipfsBinPath, ['--version'])
  t.true(output.stdout.includes('ipfs version'))

  // run cmd to uninstall ipfs locally
  process.chdir(projectPath)
  output = await parseCli(`ipfs uninstall --debug --local --skip-confirmation`)

  // check for ipfs binary again, expect error is thrown
  await t.throwsAsync(async () => execa(ipfsBinPath, ['--version']))
})
