import test from 'ava'
import sinon from 'sinon'
import { getAppKernel } from '../../src/kernel/getAppKernel'

test('Returns the correct address', async t => {
  const kernelAddress = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  const web3 = getWeb3(kernelAddress)

  t.is(
    await getAppKernel(web3, '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb'),
    kernelAddress
  )
})

test('Throws if kernel address is null', async t => {
  const web3 = getWeb3('0x0000000000000000000000000000000000000000')

  await t.throwsAsync(
    getAppKernel(web3, '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb')
  )
})

function getWeb3(kernelAddress) {
  return {
    eth: {
      Contract: sinon.stub().returns({
        methods: { kernel: () => ({ call: async () => kernelAddress }) },
      }),
    },
  }
}
