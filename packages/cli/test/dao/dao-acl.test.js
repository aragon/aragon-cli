import test from 'ava'
//
import parseCli from '../parseCli'

const daoAddressRegex = /Created DAO: (.*)\n$/

test.serial('acl view', async t => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const stdout = await parseCli(['dao', 'acl', 'view', id, '--debug'])

  t.assert(stdout.includes('App'))
  t.assert(stdout.includes('Action'))
  t.assert(stdout.includes('Allowed entities'))
  t.assert(stdout.includes('Manager'))
  t.assert(stdout.includes('CREATE_PERMISSIONS_ROLE'))
})

test.serial('acl grant', async t => {
  const newDaoStdout = await parseCli(['dao', 'new', '--debug'])
  const daoAddress = newDaoStdout.match(daoAddressRegex)[1]

  const stdout = await parseCli([
    'dao',
    'acl',
    'grant',
    daoAddress,
    daoAddress,
    'APP_MANAGER_ROLE',
    '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
    '--debug',
  ])

  t.assert(
    stdout.includes('Successfully executed'),
    'Unable to grant APP_MANAGER_ROLE role'
  )
})
