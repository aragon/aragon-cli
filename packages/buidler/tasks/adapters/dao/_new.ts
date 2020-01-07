import newDao from '@aragon/toolkit/src/dao/new'

const TemplateAbi = `[
    {
      "inputs": [
        {
          "name": "_daoFactory",
          "type": "address"
        },
        {
          "name": "_ens",
          "type": "address"
        },
        {
          "name": "_miniMeFactory",
          "type": "address"
        },
        {
          "name": "_aragonID",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "dao",
          "type": "address"
        }
      ],
      "name": "DeployDao",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "dao",
          "type": "address"
        }
      ],
      "name": "SetupDao",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "token",
          "type": "address"
        }
      ],
      "name": "DeployToken",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "appProxy",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "appId",
          "type": "bytes32"
        }
      ],
      "name": "InstalledApp",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_appId",
          "type": "bytes32"
        },
        {
          "name": "_roles",
          "type": "bytes32[]"
        },
        {
          "name": "_authorizedAddress",
          "type": "address"
        },
        {
          "name": "_initializeCallData",
          "type": "bytes"
        }
      ],
      "name": "newInstance",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "newInstance",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]`

const _newDao = async (web3) => {
  const repo = {
    abi: JSON.parse(TemplateAbi),
    contractAddress: '0x715752D24f27224d4a88957896A141Df87a50448'
  }

  const templateInstance = undefined
  const newInstanceMethod = 'newInstance'
  const newInstanceArgs = []
  const deployEvent = 'DeployDao'
  const gasPrice = 2

  const dao = await newDao({
    repo,
    web3,
    templateInstance,
    newInstanceMethod,
    newInstanceArgs,
    deployEvent,
    gasPrice,
  })

  return dao
}

export default _newDao
