import test from 'ava'
import { linkLibraries } from '../../src/lib/deploy'
import { expandLink } from '../../src/util'

test('Deploy > linkLibraries', t => {
  t.plan(1)

  const link = {
    name: 'Library1',
    address: '0x1111111111111111111111111111111111111111',
  }
  const links = [link]

  const sampleHex =
    '5300541194335152988749892502228755547482451690626856874364818603877859370'

  const bytecode = [
    '0x',
    sampleHex,
    expandLink(link).placeholder,
    sampleHex,
  ].join('')

  const bytecodeWithLibraries = linkLibraries(bytecode, links)

  t.is(
    bytecodeWithLibraries,
    ['0x', sampleHex, link.address.slice(2), sampleHex].join('')
  )
})
