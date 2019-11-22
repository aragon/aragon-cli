const chalk = require('chalk')
const defaultAPMName = require('@aragon/cli-utils/src/helpers/default-apm')
const { ensureWeb3 } = require('../../helpers/web3-fallback')
const TaskList = require('listr')
const getApmRepoVersions = require('../../lib/apm/getApmRepoVersions')

exports.command = 'versions [apmRepo]'

exports.describe =
  'Shows all the previously published versions of a given repository'

exports.builder = function(yargs) {
  return yargs.option('apmRepo', {
    description: 'Name of the APM repository',
    type: 'string',
    default: null,
  })
}

exports.handler = async function({
  reporter,
  apmRepo,
  module,
  network,
  apm: apmOptions,
}) {
  let versions, apmRepoName

  const tasks = new TaskList([
    {
      title: 'Fetching published versions',
      task: async (ctx, task) => {
        const web3 = await ensureWeb3(network)
        apmRepoName = apmRepo ? defaultAPMName(apmRepo) : module.appName

        task.title = `Fetching ${chalk.bold(apmRepoName)} published versions`

        versions = await getApmRepoVersions(web3, apmRepoName, apmOptions)
      },
    },
  ])
  await tasks.run()

  displayVersionNumbers(apmRepoName, versions, reporter)
  displayVersions(versions, reporter)
  process.exit()
}

/**
 * Display the number of published versions for the repository
 * @param {string} apmRepoName Repo name
 * @param {Object[]} versions Repo versions
 * @param {Object} reporter Reporter
 * @returns {void}
 */
function displayVersionNumbers(apmRepoName, versions, reporter) {
  reporter.info(
    `${chalk.blue(apmRepoName)} has ${chalk.green(
      versions.length
    )} published versions`
  )
}

/**
 * Display the published versions for a repository
 * @param {Object[]} versions Repo versions
 * @param {Object} reporter Reporter
 * @returns {void}
 */
function displayVersions(versions, reporter) {
  versions.map(version => {
    if (version && version.content) {
      reporter.success(
        `${chalk.blue(version.version)}: ${version.contractAddress} ${
          version.content.provider
        }:${version.content.location}`
      )
    } else if (version && version.error) {
      reporter.warning(
        `${chalk.blue(version.version)}: ${version.contractAddress} ${
          version.error
        }`
      )
    } else {
      reporter.error(
        `${chalk.blue(version.version)}: ${
          version.contractAddress
        } Version not found in provider`
      )
    }
  })
}
