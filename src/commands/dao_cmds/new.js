const TaskList = require('listr')
const Web3 = require('web3')
const daoArg = require('./utils/daoArg')
import initAragonJS from './utils/aragonjs-wrapper'
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const path = require('path')
const APM = require('@aragon/apm')
const defaultAPMName = require('../../helpers/default-apm')
const chalk = require('chalk')
const { getContract } = require('../../util')
const getRepoTask = require('./utils/getRepoTask')

exports.BARE_KIT = defaultAPMName('bare-kit')
exports.BARE_INSTANCE_FUNCTION = 'newBareInstance'

exports.command = 'new [template] [template-version]'

exports.describe = 'Create a new DAO'

exports.builder = yargs => {
  return yargs.positional('template', {
    description: 'Name of the template to use creating the DAO',
    default: exports.BARE_KIT,
  })
  .positional('template-version', {
    description: 'Version of the template to be used',
    default: 'latest'
  })
  .option('fn-args', {
    description: 'Arguments to be passed to the newInstance function (or the function passed with --fn)',
    array: true,
    default: [],
  })
  .option('fn', {
    description: 'Function to be called to create instance',
    default: exports.BARE_INSTANCE_FUNCTION
  })
}

exports.task = async ({ web3, reporter, apmOptions, template, templateVersion, fn, fnArgs, skipChecks }) => {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = await APM(web3, apmOptions)

  template = defaultAPMName(template)

  const tasks = new TaskList([
    {
      title: `Fetching template ${chalk.bold(template)}@${templateVersion}`,
      task: getRepoTask.task({ apm, apmRepo: template, apmRepoVersion: templateVersion }),
    },
    {
      title: 'Create new DAO from template',
      task: async (ctx, task) => {
        if (!ctx.accounts) {
          ctx.accounts = await web3.eth.getAccounts()
        }

        const template = new web3.eth.Contract(ctx.repo.abi, ctx.repo.contractAddress)
        const newInstanceTx = template.methods[fn](...fnArgs)

        const { events } = await newInstanceTx.send({ from: ctx.accounts[0], gas: 5e6 })
        ctx.daoAddress = events['DeployInstance'].returnValues.dao
      },
    },
    {
      title: 'Checking DAO',
      skip: () => skipChecks,
      task: async (ctx, task) => {
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

exports.handler = async function ({ reporter, network, template, templateVersion, fn, fnArgs, apm: apmOptions }) {
  const web3 = await ensureWeb3(network)

  const task = await exports.task({ web3, reporter, network, apmOptions, template, templateVersion, fn, fnArgs, skipChecks: false })
  return task.run()
    .then((ctx) => {
      reporter.success(`Created DAO: ${chalk.bold(ctx.daoAddress)}`)

      process.exit()
    })
}