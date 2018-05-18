const TaskList = require('listr')
const Web3 = require('web3')
const daoArg = require('./utils/daoArg')
import initAragonJS from './utils/aragonjs-wrapper'
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const path = require('path')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')
const chalk = require('chalk')

const BASE_TEMPLATE_REPO = 'democracy-template.aragonpm.eth'

exports.command = 'new'

exports.describe = 'Create a new DAO'

const getContract = (pkg, contract) => {
  const artifact = require(`${pkg}/build/contracts/${contract}.json`)
  return artifact
}

exports.task = async ({ web3, reporter, apmOptions }) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  const tasks = new TaskList([
    {
      title: 'Fetch template from APM',
      task: async (ctx) => {
        ctx.repo = { contractAddress: await apm.getLatestVersionContract(BASE_TEMPLATE_REPO) }
      },
    },
    {
      title: 'Fetching DAOFactory from on-chain template',
      task: async(ctx, task) => {
        try {
          const fac = await new web3.eth.Contract(
            getContract('@aragon/templates-beta', 'DemocracyTemplate').abi,
            ctx.repo.contractAddress
          ).methods.fac().call()
          try {
            ctx.contracts['DAOFactory'] = fac
          } catch (e) {
            ctx.contracts = { ['DAOFactory']: fac }
          }
          
        } catch (err) {
          console.error(`${err}\nCall failed, try using 'aragon run' or 'aragon devchain'`)
          process.exit()
        }
      },
    },
    {
      title: 'Deploy DAO',
      task: async (ctx, task) => {
        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

        const factory = new web3.eth.Contract(
          getContract('@aragon/os', 'DAOFactory').abi,
          ctx.contracts['DAOFactory']
        )

        const { events } = await factory.methods.newDAO(ctx.accounts[0]).send({
          from: ctx.accounts[0],
          gas: 5e6
        })
        ctx.daoAddress = events['DeployDAO'].returnValues.dao

        const kernel = new web3.eth.Contract(
          getContract('@aragon/os', 'Kernel').abi, ctx.daoAddress
        )
        ctx.aclAddress = await kernel.methods.acl().call()
        ctx.appManagerRole = await kernel.methods.APP_MANAGER_ROLE().call()
      }
    }
  ])

  return tasks
}

exports.handler = async function ({ reporter, network, apm: apmOptions }) {
  const web3 = await ensureWeb3(network)

  const task = await exports.task({ web3, reporter, network, apmOptions })
  return task.run()
    .then((ctx) => {
      reporter.success(`Created DAO: ${chalk.bold(ctx.daoAddress)}`)
      process.exit()
    })
}