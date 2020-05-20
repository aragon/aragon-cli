import test from 'ava'
import fs from 'fs-extra'
import path from 'path'

import { generateApplicationArtifact } from '../../src/helpers/generateArtifact'
import { abi } from './contracts/VotingAggregator/abi'
import arapp from './contracts/VotingAggregator/arapp'


test('Converts enums to the appropriate uint', async (t) => {
  const source = await fs.readFile(path.join(__dirname, './contracts/VotingAggregator/VotingAggregator.sol'), 'utf8')

  const artifact = await generateApplicationArtifact(arapp, abi, source)
  const addPowerSourceFunc = artifact.functions.find(func => func.sig.includes('addPowerSource('))

  t.deepEqual(addPowerSourceFunc.sig, 'addPowerSource(address,uint8,uint256)')
})
