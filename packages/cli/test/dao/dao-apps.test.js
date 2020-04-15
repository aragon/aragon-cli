import test from 'ava'
//
import parseCli from '../parseCli'

test.serial('lists apps from DAO', async (t) => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const stdout = await parseCli(['dao', 'apps', id, '--debug'])

  t.assert(stdout.includes('App'))
  t.assert(stdout.includes('Proxy address'))
  t.assert(stdout.includes('Content'))
  t.assert(stdout.includes('kernel'))
})

test.serial('lists all apps from DAO', async (t) => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])

  // Install permissionless app
  await parseCli(['dao', 'install', id, 'vault', '--debug'])

  const stdout = await parseCli(['dao', 'apps', id, '--all', '--debug'])

  t.assert(stdout.includes('Permissionless app'))
})
