import test, { before } from 'ava'
import fs from 'fs-extra'
import path from 'path'

import { generateApplicationArtifact } from '../../src/helpers/generateArtifact'
import { abi } from './contracts/VotingAggregator/abi'
import arapp from './contracts/VotingAggregator/arapp'

var votingAggregatorSource

before(async (t) => {
  votingAggregatorSource = await fs.readFile(
    path.join(__dirname, './contracts/VotingAggregator/VotingAggregator.sol'),
    'utf8'
  )
})

test('Converts enums to the appropriate uint', async (t) => {
  const artifact = await generateApplicationArtifact(
    arapp,
    abi,
    votingAggregatorSource
  )
  const addPowerSourceFunc = artifact.functions.find((func) =>
    func.sig.includes('addPowerSource(')
  )

  t.deepEqual(addPowerSourceFunc.sig, 'addPowerSource(address,uint8,uint256)')
})

test('Handles string and uint correctly', async (t) => {
  const artifact = await generateApplicationArtifact(
    arapp,
    abi,
    votingAggregatorSource
  )
  const initializeFunc = artifact.functions.find((func) =>
    func.sig.includes('initialize(')
  )

  t.deepEqual(initializeFunc.sig, 'initialize(string,string,uint8)')
})

test('Supports overloaded functions', async (t) => {
  const artifact = await generateApplicationArtifact(
    arapp,
    abi,
    votingAggregatorSource
  )
  const disableSourceFunc = artifact.functions.find((func) =>
    func.sig.includes('disableSource(')
  )

  t.deepEqual(disableSourceFunc.sig, 'disableSource(address)')
})
