import test from 'ava'
import parseCli from '../parseCli'

test.serial('creates a new token', async t => {
  const stdout = await parseCli([
    'dao',
    'token',
    'new',
    'MyToken',
    'TKN',
    '--debug',
  ])

  t.assert(
    stdout.includes('Successfully deployed the token'),
    "Can't deploy token"
  )
  t.assert(
    stdout.includes('Successfully deployed the token factory'),
    "Can't deploy token factory"
  )
})
