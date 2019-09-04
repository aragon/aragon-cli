module.exports = [
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
    name: 'daoFactory',
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
    name: 'miniMeFactory',
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
    name: 'aragonID',
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
    inputs: [
      {
        name: '_daoFactory',
        type: 'address',
      },
      {
        name: '_ens',
        type: 'address',
      },
      {
        name: '_miniMeFactory',
        type: 'address',
      },
      {
        name: '_aragonID',
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
    name: 'DeployDao',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'token',
        type: 'address',
      },
    ],
    name: 'DeployToken',
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
        name: 'initializeCallData',
        type: 'bytes',
      },
    ],
    name: 'newInstance',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'newInstance',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
