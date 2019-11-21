import test from 'ava'
import { getAppProxyAddressFromReceipt } from '../../../src/lib/dao/kernel'

test('getAppProxyAddressFromReceipt', t => {
  /**
   * Sample receipt got from a console.log() in
   *
   *   packages/aragon-cli/src/commands/dao_cmds/install.js: 'Fetching deployed app' task
   *
   * After running
   *
   *  aragon dao install 0x6A84F290D9CCC3dFe8784bD4DD8ebbf69168D058 vault --debug
   *
   */
  const dao = '0x6A84F290D9CCC3dFe8784bD4DD8ebbf69168D058'
  const sampleReceipt = {
    transactionHash:
      '0xc92b673122081c519825bd2110b673e291a6649af4bcad9f667971a12637d7fc',
    transactionIndex: 0,
    blockHash:
      '0x9edf4a589095bd7af855436dfdc47ba6d4b827d87e0f2523d0216effa9809fab',
    blockNumber: 94,
    from: '0xb4124ceb3451635dacedd11767f004d8a28c6ee7',
    to: '0x6a84f290d9ccc3dfe8784bd4dd8ebbf69168d058',
    gasUsed: 372564,
    cumulativeGasUsed: 372564,
    contractAddress: null,
    logs: [
      {
        logIndex: 0,
        transactionIndex: 0,
        transactionHash:
          '0xc92b673122081c519825bd2110b673e291a6649af4bcad9f667971a12637d7fc',
        blockHash:
          '0x9edf4a589095bd7af855436dfdc47ba6d4b827d87e0f2523d0216effa9809fab',
        blockNumber: 94,
        address: '0x6A84F290D9CCC3dFe8784bD4DD8ebbf69168D058',
        data:
          '0x000000000000000000000000b1abaadbbe50d99c5cdf6f2a3a3bbf6a900c278500000000000000000000000000000000000000000000000000000000000000017e852e0fcfce6551c13800f1e7476f982525c2b5277ba14b24339c68416336d1',
        topics: [
          '0xd880e726dced8808d727f02dd0e6fdd3a945b24bfee77e13367bcbe61ddbaf47',
        ],
        type: 'mined',
        id: 'log_94de402a',
      },
    ],
    status: true,
    logsBloom:
      '0x00000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000',
    v: '0x1c',
    r: '0x54a1cf5ec0e6444d2986c8eb270100af6fe122dbe604da31914c686715a97754',
    s: '0x2cc8fb50eeb41374f93b05a19dd65b2d136d97a715ec1d18ea91cbe8b95f74de',
  }

  const appAddress = getAppProxyAddressFromReceipt(dao, sampleReceipt)
  t.is(appAddress, '0xb1abaADBBe50d99C5CdF6F2A3a3BBf6a900C2785')
})
