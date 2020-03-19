import test from 'ava'
import { getAragenProvider } from '../testHelpers'

import { Registry } from '../../src/apm/registry'

test('Fetches list of APM repos from the aragonpm registry in aragen', async t => {
  const apmRegistryName = 'aragonpm.eth'

  const provider = getAragenProvider()
  const registry = Registry(provider)
  const packages = await registry.getRegistryPackages(apmRegistryName)

  const names = packages.map(p => p.name)
  t.true(names.includes('finance'))
  t.true(names.includes('voting'))
  t.true(names.includes('agent'))
  t.true(names.includes('company-template'))
  t.true(names.includes('apm-registry'))
})
