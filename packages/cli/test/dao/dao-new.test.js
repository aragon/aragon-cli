import parseCli from '../parseCli'

const daoAddressRegex = /Created DAO: (.*)\n$/
const daoIdAndAddressAddressRegex = /Created DAO: (.*) at (.*)\n$/

test('creates a new DAO', async () => {
  const stdout = await parseCli(['dao', 'new', '--debug'])
  const daoAddress = stdout.match(daoAddressRegex)[1]

  expect(stdout.includes('Start IPFS')).toBe(true)
  expect(/0x[a-fA-F0-9]{40}/.test(daoAddress)).toEqual(
    true,
    'Invalid DAO address'
  )
})

test('assigns an Aragon Id with the "--aragon-id" param', async () => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  const stdout = await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const [, daoId, daoAddress] = stdout.match(daoIdAndAddressAddressRegex)

  expect(daoId === id).toEqual(true, 'Invalid Aragon Id')
  expect(/0x[a-fA-F0-9]{40}/.test(daoAddress)).toEqual(
    true,
    'Invalid DAO address'
  )
})

test('creates a new DAO with a custom template', async () => {
  const stdout = await parseCli([
    'dao',
    'new',
    'membership-template',
    '1.0.0',
    '--fn',
    'newTokenAndInstance',
    '--fn-args',
    'MyToken',
    'TKN',
    `MyDao${new Date().getTime()}`,
    '["0xb4124cEB3451635DAcedd11767f004d8a28c6eE7"]',
    '["500000000000000000", "50000000000000000", "604800"]',
    '1296000',
    'true',
    '--debug',
  ])
  const daoAddress = stdout.match(daoAddressRegex)[1]

  const appStdout = await parseCli(['dao', 'apps', daoAddress, '--debug'])

  expect(appStdout.includes('voting')).toBe(true)
  expect(appStdout.includes('token-manager')).toBe(true)
  expect(appStdout.includes('finance')).toBe(true)
  expect(appStdout.includes('agent')).toBe(true)

  expect(/0x[a-fA-F0-9]{40}/.test(daoAddress)).toEqual(
    true,
    'Invalid DAO address'
  )
})
