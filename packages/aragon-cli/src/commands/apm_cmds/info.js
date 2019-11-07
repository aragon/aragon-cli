const APM = require('@aragon/apm')
const chalk = require('chalk')
const TaskList = require('listr')
const defaultAPMName = require('@aragon/cli-utils/src/helpers/default-apm')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const getRepoTask = require('../dao_cmds/utils/getRepoTask')

exports.command = 'info <apmRepo> [apmRepoVersion]'

exports.describe = 'Get information about a package'

exports.builder = getRepoTask.args

exports.handler = async function({
  apmRepo,
  apm: apmOptions,
  apmRepoVersion,
  network,
}) {
  const web3 = await ensureWeb3(network)
  apmRepo = defaultAPMName(apmRepo)
  const apm = await APM(web3, apmOptions)

  const tasks = new TaskList([
    {
      title: `Fetching ${chalk.bold(apmRepo)}@${apmRepoVersion}`,
      task: getRepoTask.task({
        apm,
        apmRepo,
        apmRepoVersion,
        artifactRequired: false,
      }),
    },
  ])

  return tasks.run().then(ctx => {
    delete ctx.repo.abi
    delete ctx.repo.environments

    console.log(JSON.stringify(ctx.repo, null, 2))
    process.exit()
  })
}
