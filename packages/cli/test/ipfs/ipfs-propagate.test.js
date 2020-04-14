import test from 'ava'
import parseCli from '../parseCli'

test.serial('ipfs propagate readme directory', async (t) => {
  const stdout = await parseCli([
    'ipfs',
    'propagate',
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    '--debug',
  ])

  t.assert(stdout.includes('Requests succeeded:'))
})
