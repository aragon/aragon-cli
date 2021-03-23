import grantNewVersionsPermission from '../../src/apm/grantNewVersionsPermission'
import APM from '@aragon/apm'
import ACL from '../../src/apm/util/acl'

/* Default values */

const apmRepoName = 'test.aragonpm.eth'
const apmOptions = {}
apmOptions.ensRegistryAddress = '0x1234512345123451234512345123451234512345'
const gasPrice = 1
const txOptions = { gasPrice }
const grantees = ['0x1234512345123451234512345123451234512345']
const progressHandler = () => {}

jest.mock('@aragon/apm')
jest.mock('../../src/apm/util/acl')

/* Setup and cleanup */
let context

beforeEach(() => {
  const web3Stub = {
    eth: {
      getAccounts: async () => ['0x1234512345123451234512345123451234512345'],
      sendTransaction: async () => {
        return {
          transactionHash:
            '0x1234512345123451234512345123451234512345123451234512345123451234',
        }
      },
    },
  }

  APM.mockResolvedValue({
    getRepository: () => {
      return {
        options: { address: '0x1234512345123451234512345123451234512345' },
      }
    },
  })
  ACL.mockResolvedValue({
    grant: () => {
      return {}
    },
  })

  context = {
    web3Stub,
  }
})

/* Tests */

test('properly throws when transaction fails', async () => {
  const { web3Stub } = context

  web3Stub.eth.sendTransaction = () => {
    // eslint-disable-next-line no-throw-literal
    throw 'Some Error'
  }

  try {
    await grantNewVersionsPermission(
      web3Stub,
      apmRepoName,
      apmOptions,
      grantees,
      null,
      txOptions
    )
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {}
})

test('Should throw when no grantees are provided', async () => {
  const { web3Stub } = context

  try {
    await grantNewVersionsPermission(
      web3Stub,
      apmRepoName,
      apmOptions,
      [],
      null,
      txOptions
    )
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {}
})

test('properly calls the progressHandler when nothing errors', async () => {
  const { web3Stub } = context

  const progressHandlerSpy = jest.fn()
  const transactionHash =
    '0x1234512345123451234512345123451234512345123451234512345123451234'

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandlerSpy,
    txOptions
  )

  expect(progressHandlerSpy).toHaveBeenCalledTimes(3)
  expect(progressHandlerSpy).toHaveBeenCalledWith(1)
  expect(progressHandlerSpy).toHaveBeenCalledWith(2, grantees[0])
  expect(progressHandlerSpy).toHaveBeenCalledWith(3, transactionHash)
})

test('properly calls web3.eth.sendTransaction() with expected transaction parameters', async () => {
  const { web3Stub } = context

  ACL.mockResolvedValue({
    grant: () => {
      return { name: 'grantResponse' }
    },
  })

  const sendTransactionStub = jest.fn(web3Stub.eth.sendTransaction)

  const grantees = ['0x01', '0x02', '0x02']

  const enhancedWeb3Stub = {
    eth: {
      getAccounts: async () => ['0x1234512345123451234512345123451234512345'],
      sendTransaction: sendTransactionStub,
    },
  }

  await grantNewVersionsPermission(
    enhancedWeb3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  let callCounter = 0
  for (let i = 0; i < sendTransactionStub.mock.calls.length; i++) {
    const stubCall = sendTransactionStub.mock.calls[i]
    const arg = stubCall[0]
    if (arg.name && arg.name === 'grantResponse') {
      callCounter++
    }
  }

  expect(callCounter).toBe(grantees.length)
})

test('properly calls acl.grant() with each of the grantee addresses', async () => {
  const { web3Stub } = context

  const grantMock = jest.fn(() => {
    return {}
  })
  ACL.mockResolvedValue({
    grant: grantMock,
  })

  const repoAddress = '0x1234512345123451234512345123451234512345'

  const grantees = ['0x01', '0x02', '0x02']

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  expect(grantMock).toHaveBeenCalledTimes(3)
  expect(grantMock).toHaveBeenCalledWith(repoAddress, grantees[0])
  expect(grantMock).toHaveBeenCalledWith(repoAddress, grantees[1])
  expect(grantMock).toHaveBeenCalledWith(repoAddress, grantees[2])
})

test('tolerates a progressHandler not being specified', async () => {
  const { web3Stub } = context

  try {
    await grantNewVersionsPermission(
      web3Stub,
      apmRepoName,
      apmOptions,
      grantees,
      progressHandler,
      txOptions
    )
  } catch (error) {
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  }
})

test('properly throws if apm.getRepository does not find a repository', async () => {
  const { web3Stub } = context

  APM.mockResolvedValue({
    getRepository: () => null,
  })

  try {
    await grantNewVersionsPermission(
      web3Stub,
      apmRepoName,
      apmOptions,
      grantees,
      progressHandler,
      txOptions
    )
    // eslint-disable-next-line no-undef
    fail('it should not reach here')
  } catch (error) {
    expect(
      error
        .toString()
        .includes(
          `Repository ${apmRepoName} does not exist and it's registry does not exist`
        )
    ).toBe(true)
  }
})

test('calls apm.getRepository() with the correct parameters', async () => {
  const { web3Stub } = context

  const getRepositoryMock = jest.fn(() => {
    return {
      options: { address: '0x1234512345123451234512345123451234512345' },
    }
  })
  APM.mockResolvedValue({
    getRepository: getRepositoryMock,
  })

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  expect(getRepositoryMock).toHaveBeenCalledTimes(1)
})

test('APM constructor gets called with the appropriate parameters', async () => {
  const { web3Stub } = context

  const getRepositoryMock = jest.fn(() => {
    return {
      options: { address: '0x1234512345123451234512345123451234512345' },
    }
  })
  APM.mockResolvedValue({
    getRepository: getRepositoryMock,
  })

  await grantNewVersionsPermission(
    web3Stub,
    apmRepoName,
    apmOptions,
    grantees,
    progressHandler,
    txOptions
  )

  expect(APM).toHaveBeenCalledWith(web3Stub, apmOptions)
  expect(getRepositoryMock).toHaveBeenCalledTimes(1)
})
