import test from 'ava'
import parseCli from '../parseCli'

test.serial('fetches app versions', async t => {
  const output = await parseCli(['apm', 'versions', 'voting', '--debug'])

  t.assert(output.includes('voting.aragonpm.eth'))
})

test.serial('fetches app versions with full ens name', async t => {
  const output = await parseCli([
    'apm',
    'versions',
    'finance.aragonpm.eth',
    '--debug',
  ])

  t.assert(output.includes('finance.aragonpm.eth'))
})

test.serial('publish fails if not in an aragon project directory', async t => {
  t.plan(1)

  try {
    await parseCli([
      'apm',
      'publish',
      'major',
      '--files',
      'app',
      '--skip-confirmation',
      '--no-propagate-content',
      '--debug',
    ])
  } catch (err) {
    t.assert(err.message.includes('This directory is not an Aragon project'))
  }
})

test.serial('grant fails if not in an aragon project directory', async t => {
  await t.throwsAsync(async () => {
    return parseCli([
      'apm',
      'grant',
      '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
      '--debug',
    ])
  })
})

test.serial('fetches app info', async t => {
  const output = await parseCli(['apm', 'info', 'finance', '--debug'])

  t.assert(
    output.includes('"name": "Finance"'),
    "App info doesn't contain name"
  )
  t.assert(
    output.includes('"author": "Aragon Association",'),
    "App info doesn't contain author"
  )
  t.assert(
    output.includes(
      '"description": "Manage an organization\'s financial assets"'
    ),
    "App info doesn't contain description"
  )
  t.assert(
    output.includes(
      '"changelog_url": "https://github.com/aragon/aragon-apps/releases"'
    ),
    "App info doesn't contain changelog url"
  )
  t.assert(
    output.includes(
      '"source_url": "https://github.com/aragon/aragon-apps/blob/master/apps/finance"'
    ),
    "App info doesn't contain source url"
  )
})

test.serial('fetches packages', async t => {
  const output = await parseCli(['apm', 'packages', '--debug'])

  t.assert(output.includes('apm-registry'), 'Missing apm-registry')
  t.assert(output.includes('apm-enssub'), 'Missing apm-enssub')
  t.assert(output.includes('apm-repo'), 'Missing apm-repo')
  t.assert(output.includes('aragon'), 'Missing aragon')
  t.assert(output.includes('agent'), 'Missing agent')
  t.assert(output.includes('finance'), 'Missing finance')
  t.assert(output.includes('token-manager'), 'Missing token-manager')
  t.assert(output.includes('vault'), 'Missing vault')
})
