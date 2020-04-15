import test from 'ava'
import parseCli from '../parseCli'

test('ipfs view readme directory', async (t) => {
  const stdout = await parseCli([
    'ipfs',
    'view',
    'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    '--debug',
  ])

  t.assert(stdout.includes('about'), "Directory doesn't contain about file")
  t.assert(stdout.includes('help'), "Directory doesn't contain help file")
  t.assert(stdout.includes('contact'), "Directory doesn't contain contact file")
})
