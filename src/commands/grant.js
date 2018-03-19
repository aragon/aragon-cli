const Web3 = require('web3')
const fs = require('fs')
const tmp = require('tmp-promise')
const path = require('path')
const { promisify } = require('util')
const { copy, readJson, writeJson } = require('fs-extra')
const { MessageError } = require('../errors')
const extract = require('../helpers/solidity-extractor')
const APM = require('../apm')
const semver = require('semver')
const EthereumTx = require('ethereumjs-tx')
const namehash = require('eth-ens-namehash')
const multimatch = require('multimatch')
const { keccak256 } = require('js-sha3')

exports.command = 'grant [address]'
exports.describe = 'Grant an address permission to create new versions in this package'

exports.handler = async function (reporter, {
  // Globals
  cwd,
  ethRpc,
  keyfile,
  module,
  apm: apmOptions,

  // Arguments
  address,
}) {
  const web3 = new Web3(keyfile.rpc ? keyfile.rpc : ethRpc)
  const privateKey = keyfile.key ? keyfile.key : key

  apmOptions.ensRegistry = !apmOptions.ensRegistry ? keyfile.ens : apmOptions.ensRegistry

  const apm = await APM(web3, apmOptions)

  if (!module || !Object.keys(module).length) {
    throw new MessageError('This directory is not an Aragon project',
      'ERR_NOT_A_PROJECT')
  }

  new web3.eth.Contract(require('../../abi/apm/Repo.json'), address)

}
