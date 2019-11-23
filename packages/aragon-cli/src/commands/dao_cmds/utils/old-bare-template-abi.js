export default [
  {
    constant: true,
    inputs: [],
    name: 'ens',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'fac',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: 'appId',
        type: 'bytes32',
      },
    ],
    name: 'latestVersionAppBase',
    outputs: [
      {
        name: 'base',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        name: '_fac',
        type: 'address',
      },
      {
        name: '_ens',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'dao',
        type: 'address',
      },
    ],
    name: 'DeployInstance',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'appProxy',
        type: 'address',
      },
      {
        indexed: false,
        name: 'appId',
        type: 'bytes32',
      },
    ],
    name: 'InstalledApp',
    type: 'event',
  },
  {
    constant: false,
    inputs: [],
    name: 'newBareInstance',
    outputs: [
      {
        name: 'dao',
        type: 'address',
      },
      {
        name: 'proxy',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'appId',
        type: 'bytes32',
      },
      {
        name: 'roles',
        type: 'bytes32[]',
      },
      {
        name: 'authorizedAddress',
        type: 'address',
      },
      {
        name: 'initializeCalldata',
        type: 'bytes',
      },
    ],
    name: 'newInstance',
    outputs: [
      {
        name: 'dao',
        type: 'address',
      },
      {
        name: 'proxy',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
