import test from 'ava'
//
import { expandLink } from '../../src/utils/expandLink'

test('expandLink returns the correct values', t => {
  const link = expandLink({
    name: 'test',
    address: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  })

  t.is(link.name, 'test')
  t.is(link.address, '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7')
  t.is(link.placeholder, '__test__________________________________')
  t.is(link.addressBytes, 'b4124cEB3451635DAcedd11767f004d8a28c6eE7')
})
