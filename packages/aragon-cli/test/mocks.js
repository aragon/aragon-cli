import sinon from 'sinon'

/**
 * APM stub for @aragon/apm
 */
export function apmStub() {
  const apmStub = sinon.stub()
  apmStub.returns({
    getAllVersions: async () => {},
    getLatestVersion: async () => {},
    getRepoRegistry: async () => {
      return { getPastEvents: () => [] }
    },
    getRepository: async () => {
      return {
        options: { address: '0x1234512345123451234512345123451234512345' },
      }
    },
    getVersion: async () => {},
  })

  return apmStub
}

/**
 * web3 stub with `eth` object
 */
export function web3Stub(contractMethods = {}) {
  return {
    eth: {
      Contract: sinon.stub().returns({
        methods: contractMethods,
      }),
      sendTransaction: async () => {
        return {
          transactionHash:
            '0x1234512345123451234512345123451234512345123451234512345123451234',
        }
      },
      getAccounts: sinon
        .stub()
        .returns(['0x1234512345123451234512345123451234512345']),
    },
  }
}

/**
 * ACL stub with `grant` method
 */
export function aclStub() {
  const stub = sinon.stub()
  stub.returns({
    grant: () => {
      return {}
    },
  })

  return stub
}

/**
 * ENS stub with `owner` and `resolver`
 */
export function ensStub() {
  const stub = sinon.stub()

  stub.returns({
    owner: sinon.stub(),

    resolver: sinon.stub().returns({
      addr: sinon.stub().returns('dao.aragonid.eth'),
    }),
  })

  return stub
}
