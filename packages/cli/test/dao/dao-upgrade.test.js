import test from 'ava'
//
import parseCli from '../parseCli'

test.serial('upgrades an app', async t => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  await parseCli(['dao', 'install', id, 'vault', '--debug'])
  const stdout = await parseCli(['dao', 'upgrade', id, 'vault', '--debug'])

  t.assert(stdout.includes('Start IPFS'))
  t.assert(stdout.includes('Successfully executed'), 'Unable to upgrade vault')
})
