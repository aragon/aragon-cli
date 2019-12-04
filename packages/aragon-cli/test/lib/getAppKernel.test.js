import getAppKernel from '../../src/lib/getAppKernel'
import { web3Stub } from '../mocks'
import test from 'ava'

test('Returns the correct address', async t => {
  t.plan(1)

  const kernelAddress = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  const web3 = getWeb3(kernelAddress)

  t.is(
    await getAppKernel(web3, '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb'),
    kernelAddress
  )
})

test('Throws if kernel address is null', async t => {
  t.plan(1)

  const web3 = getWeb3('0x0000000000000000000000000000000000000000')

  await t.throwsAsync(
    getAppKernel(web3, '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb')
  )
})

function getWeb3(kernelAddress) {
  return web3Stub({ kernel: () => ({ call: async () => kernelAddress }) })
}
