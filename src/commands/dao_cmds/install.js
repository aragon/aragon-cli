const TaskList = require('listr')
const Web3 = require('web3')
const daoArg = require('./utils/daoArg')
import initAragonJS from './utils/aragonjs-wrapper'
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const path = require('path')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')
const chalk = require('chalk')

const LATEST_VERSION = 'latest'
const ANY_ENTITY = '0xffffffffffffffffffffffffffffffffffffffff'

const getContract = (pkg, contract) => {
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}

const setPermissions = async (web3, sender, aclAddress, permissions) => {
  const acl = new web3.eth.Contract(
    getContract('@aragon/os', 'ACL').abi,
    aclAddress
  )
  return Promise.all(
    permissions.map(([who, where, what]) =>
      acl.methods.createPermission(who, where, what, who).send({
        from: sender,
        gasLimit: 1e6
      })
    )
  )
}

exports.command = 'install <dao> <apmRepo> [apmRepoVersion]'

exports.describe = 'Install an app into a DAO'

exports.builder = function (yargs) {
  return daoArg(yargs)
}

exports.task = async ({ web3, reporter, dao, network, apmOptions, apmRepo, apmRepoVersion = LATEST_VERSION }) => {
  const apm = await APM(web3, apmOptions)

  apmRepo = defaultAPMName(apmRepo)
  // TODO: Resolve DAO ens name

  const tasks = new TaskList([
    {
      title: `Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`,
      task: async (ctx, task) => {
        if (apmRepoVersion == LATEST_VERSION) {
          ctx.repo = await apm.getLatestVersion(apmRepo)
        } else {
          ctx.repo = await apm.getVersion(apmRepo, apmRepoVersion.split('.'))
        }

        // appId is loaded from artifact.json in IPFS
        if (!ctx.repo.appId) {
          throw new Error("Cannot find artifacts in APM repo. Please make sure the package is published and IPFS running.")
        }
      }
    },
    {
      title: 'Deploying app instance',
      task: async (ctx) => {
        const kernel = new web3.eth.Contract(
          getContract('@aragon/os', 'Kernel').abi,
          dao
        )

        ctx.aclAddress = await kernel.methods.acl().call()
        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

        const { events } = await kernel.methods.newAppInstance(
          ctx.repo.appId,
          ctx.repo.contractAddress
        ).send({
          from: ctx.accounts[0],
          gasLimit: 1e6
        })
        
        ctx.appAddress = events['NewAppProxy'].returnValues.proxy
      }
    },
    {
      title: 'Set permissions',
      task: async (ctx, task) => {
        if (!ctx.repo.roles || ctx.repo.roles.length === 0) {
          throw new Error('You have no permissions defined in your arapp.json\nThis is required for your app to properly show up.')
          return
        }

        const permissions = ctx.repo.roles
          .map((role) => [ANY_ENTITY, ctx.appAddress, role.bytes])

        return setPermissions(
          web3,
          ctx.accounts[0],
          ctx.aclAddress,
          permissions
        )
      }
    }
  ])

  return tasks.run()
    .then((ctx) => {
      reporter.success(`Installed ${apmRepo} at: ${chalk.bold(ctx.appAddress)}`)
    })
}

exports.handler = async function ({ reporter, dao, network, apm: apmOptions, apmRepo, apmRepoVersion }) {
  const web3 = await ensureWeb3(network)
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']

  return exports.task({ web3, reporter, dao, network, apmOptions, apmRepo, apmRepoVersion })
}