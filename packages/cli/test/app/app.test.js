import parseCli from '../parseCli'

jest.setTimeout(60000)

test('fetches app versions', async () => {
  const output = await parseCli(['apm', 'versions', 'voting', '--debug'])

  expect(output.includes('voting.aragonpm.eth')).toBe(true)
})

test('fetches app versions with full ens name', async () => {
  const output = await parseCli([
    'apm',
    'versions',
    'finance.aragonpm.eth',
    '--debug',
  ])

  expect(output.includes('finance.aragonpm.eth')).toBe(true)
})

test('publish fails if not in an aragon project directory', async () => {
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
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {}
})

test('grant fails if not in an aragon project directory', async () => {
  try {
    await parseCli([
      'apm',
      'grant',
      '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
      '--debug',
    ])
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {}
})

test('fetches app info', async () => {
  const output = await parseCli(['apm', 'info', 'finance', '--debug'])

  expect(output.includes('"name": "Finance"')).toEqual(
    true,
    "App info doesn't contain name"
  )
  expect(output.includes('"author": "Aragon Association",')).toEqual(
    true,
    "App info doesn't contain author"
  )
  expect(
    output.includes(
      '"description": "Manage an organization\'s financial assets"'
    )
  ).toEqual(true, "App info doesn't contain description")
  expect(
    output.includes(
      '"changelog_url": "https://github.com/aragon/aragon-apps/releases"'
    )
  ).toEqual(true, "App info doesn't contain changelog url")
  expect(
    output.includes(
      '"source_url": "https://github.com/aragon/aragon-apps/blob/master/apps/finance"'
    )
  ).toEqual(true, "App info doesn't contain source url")
})

test('fetches packages', async () => {
  const output = await parseCli(['apm', 'packages', '--debug'])

  expect(output.includes('apm-registry')).toEqual(true, 'Missing apm-registry')
  expect(output.includes('apm-enssub')).toEqual(true, 'Missing apm-enssub')
  expect(output.includes('apm-repo')).toEqual(true, 'Missing apm-repo')
  expect(output.includes('aragon')).toEqual(true, 'Missing aragon')
  expect(output.includes('agent')).toEqual(true, 'Missing agent')
  expect(output.includes('finance')).toEqual(true, 'Missing finance')
  expect(output.includes('token-manager')).toEqual(
    true,
    'Missing token-manager'
  )
  expect(output.includes('vault')).toEqual(true, 'Missing vault')
  expect(output.includes('voting')).toEqual(true, 'Missing voting')
  expect(output.includes('bare-template')).toEqual(
    true,
    'Missing bare-template'
  )
  expect(output.includes('company-template')).toEqual(
    true,
    'Missing company-template'
  )
  expect(output.includes('membership-template')).toEqual(
    true,
    'Missing membership-template'
  )
})
