import test from 'ava'
//
import parseCli from '../parseCli'

test.serial('installs a new app', async t => {
  const date = new Date().getTime()
  const id = `newdao${date}`

  await parseCli(['dao', 'new', '--debug', '--aragon-id', id])
  const installStdout = await parseCli([
    'dao',
    'install',
    id,
    'vault',
    '--debug',
  ])

  t.assert(
    installStdout.includes('Installed vault.aragonpm.eth'),
    'Unable to install vault'
  )
})
