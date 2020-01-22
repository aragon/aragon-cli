import test from 'ava'
import parseCli from '../parseCli'

test.serial('ipfs view readme directory', async t => {
  const stdout = await parseCli([
    'ipfs',
    'view',
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    '--debug',
  ])

  t.assert(stdout.includes('about'), "Directory doesn't contain about file")
})
