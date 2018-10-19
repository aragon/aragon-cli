module.exports = [
  {
    'constant': false,
    'inputs': [
      {
        'name': 'appId',
        'type': 'bytes32'
      },
      {
        'name': 'roles',
        'type': 'bytes32[]'
      },
      {
        'name': 'authorizedAddress',
        'type': 'address'
      },
      {
        'name': 'initializeCalldata',
        'type': 'bytes'
      }
    ],
    'name': 'newInstance',
    'outputs': [
      {
        'name': 'dao',
        'type': 'address'
      },
      {
        'name': 'proxy',
        'type': 'address'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [],
    'name': 'newBareInstance',
    'outputs': [
      {
        'name': 'dao',
        'type': 'address'
      },
      {
        'name': 'proxy',
        'type': 'address'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': false,
        'name': 'dao',
        'type': 'address'
      }
    ],
    'name': 'DeployInstance',
    'type': 'event'
  }
]
