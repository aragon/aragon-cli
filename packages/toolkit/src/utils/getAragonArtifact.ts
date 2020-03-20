import { mapValues } from 'lodash'
import { AragonAppJson, AragonArtifact } from '../types'
import { keccak256, AbiItem } from 'web3-utils'
import { AragonContractFunction } from './parseContractFunctions'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const namehash = require('eth-ens-namehash')

export function getAragonArtifact(
  arapp: AragonAppJson,
  functions: AragonContractFunction[],
  abi: AbiItem[]
): AragonArtifact {
  return {
    ...arapp,

    // Artifact appears to require the appId of each environment
    environments: mapValues(arapp.environments, environment => ({
      ...environment,
      appId: namehash.hash(environment.appName),
    })),

    // Artifact appears to require the abi of each function
    functions: functions.map(fn => ({
      // #### Todo: Is the signature actually necessary?
      roles: fn.roles.map(role => role.id),
      notice: fn.notice,
      abi: abi.find(
        abiElem =>
          abiElem.type === 'function' &&
          abiElem.name === fn.name &&
          abiElem.inputs &&
          abiElem.inputs.length === fn.paramTypes.length
      ),
    })),

    // Artifact appears to require the roleId to have bytes precomputed
    roles: (arapp.roles || []).map(role => ({
      ...role,
      bytes: keccak256(role.id),
    })),

    abi,
    // Additional metadata
    flattenedCode: `./code.sol`,
  }
}
