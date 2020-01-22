import { ens } from '@aragon/aragen'
//
import newDao from '../../src/dao/new'
import getApmRepo from '../../src/apm/getApmRepo'
import defaultAPMName from '../../src/helpers/default-apm'
import { getLocalWeb3 } from './getLocalWeb3'

export default async () => {
  const web3 = await getLocalWeb3()

  const repo = await getApmRepo(
    web3,
    defaultAPMName('bare-template'),
    { ensRegistryAddress: ens },
    'latest'
  )

  const daoAddress = await newDao({
    repo,
    web3,
    // newInstanceMethod: 'newInstance',
    newInstanceArgs: [],
    deployEvent: 'DeployDao',
  })

  return daoAddress
}
