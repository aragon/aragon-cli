import test from 'ava'
//
import sinon from 'sinon'
const proxyquire = require('proxyquire').noCallThru()

const runPrepareForPublishTask = proxyquire(
  '../../../src/commands/apm_cmds/util/runPrepareForPublishTask',
  {
    '@aragon/toolkit': {
      loadArappFile: () => ({
        path: {
          contractPath: '',
        },
        roles: {},
      }),
      useEnvironment: () => ({
        web3: {
          eth: {
            getAccounts: () => [],
          },
        },
        apmOptions: {},
        appName: '',
      }),
      getApm: () => ({
        publishVersionIntent: () => {},
      }),
      APM_INITIAL_VERSIONS: {
        includes: () => true,
      },
      generateApplicationArtifact: () => ({}),
    },
    '../../../lib/publish/preprareFiles': {
      prepareFilesForPublishing: () => {},
    },
    path: {
      resolve: () => '',
      basename: () => '',
    },
    'fs-extra': {
      readJsonSync: () => mockContractInterface,
      readFile: () => '',
    },
  }
).default

const mockContractInterface = {
  abi: [
    {
      constant: false,
      inputs: [],
      name: 'proxyType',
      outputs: [
        {
          name: 'proxyTypeId',
          type: 'uint256',
        },
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
}

const mockInput = {
  reporter: '',
  cwd: '',
  environment: '',
  publishDir: '',
  files: '',
  ignore: '',
  httpServedFrom: '',
  provider: '',
  onlyArtifacts: '',
  onlyContent: '',
  http: '',
  initialRepo: '',
  initialVersion: '',
  version: '',
  contractAddress: '',
  silent: '',
  debug: '',
}

const logSpy = sinon.spy(console, 'log')

test.after('cleanup', t => {
  logSpy.restore()
})

test('should generate artifacts and warn of collisions', async t => {
  await runPrepareForPublishTask(mockInput)
  t.assert(logSpy.calledWithMatch('WARNING'))
})
