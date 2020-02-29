import test from 'ava'
import sinon from 'sinon'
//
import grantNewVersionsPermission from '../../../src/dao/acl/grantNewVersionsPermission'
import { useEnvironment } from '../../../src/helpers/useEnvironment'

import { abi as aclAbi } from '@aragon/abis/os/artifacts/ACL'
import { abi as aragonAppAbi } from '@aragon/abis/os/artifacts/AragonApp'
import { abi as kernelAbi } from '@aragon/abis/os/artifacts/Kernel'
import { abi as repoAbi } from '@aragon/abis/os/artifacts/Repo'

/* Default values */
let web3
let apmRepoName
let progressHandler
let accounts
let grantees
let receipts
let acl, role

const repoAddress = '0x9cB775993A91Fc6A3b185337EfDB349A282Af77e'

/* Utils, similar to ACL.js */

const getACL = async repoAddr => {
  const repo = new web3.eth.Contract(aragonAppAbi, repoAddr)
  const daoAddr = await repo.methods.kernel().call()
  const dao = new web3.eth.Contract(kernelAbi, daoAddr)
  const aclAddr = await dao.methods.acl().call()

  return new web3.eth.Contract(aclAbi, aclAddr)
}

const getRoleId = async repoAddr => {
  const repo = new web3.eth.Contract(repoAbi, repoAddr)
  return repo.methods.CREATE_VERSION_ROLE().call()
}

/* Setup and cleanup */

test.before('setup and make a successful call', async () => {
  const env = useEnvironment()
  web3 = env.web3

  accounts = await web3.eth.getAccounts()
  grantees = [accounts[1]]

  apmRepoName = 'voting.aragonpm.eth'

  progressHandler = sinon.spy()

  acl = await getACL(repoAddress)
  role = await getRoleId(repoAddress)

  receipts = await grantNewVersionsPermission(
    grantees,
    apmRepoName,
    progressHandler
  )
})

/* Tests */

test('permissions are not set for any accounts', async t => {
  const anyone = accounts[2]

  const hasPermission = await acl.methods
    .hasPermission(anyone, repoAddress, role)
    .call()

  t.false(hasPermission)
})

test('properly sets permissions for grantees', async t => {
  const grantee = grantees[0]

  const hasPermission = await acl.methods
    .hasPermission(grantee, repoAddress, role)
    .call()

  t.true(hasPermission)
})

test('properly calls the progressHandler', t => {
  const receipt = receipts[0]

  t.is(progressHandler.callCount, 3)
  t.true(progressHandler.getCall(0).calledWith(1))
  t.true(progressHandler.getCall(1).calledWith(2, grantees[0]))
  t.true(progressHandler.getCall(2).calledWith(3, receipt.transactionHash))
})

test('Should throw when no grantees are provided', async t => {
  await t.throwsAsync(
    grantNewVersionsPermission([], apmRepoName, progressHandler)
  )
})
