import { green, blue, bold } from 'chalk'
import TaskList from 'listr'
import { Toolkit, getDefaultApmName } from '@aragon/toolkit'

export const command = 'versions [apmRepo]'
export const describe =
  'Shows all the previously published versions of a given repository'

export const builder = function(yargs) {
  return yargs.option('apmRepo', {
    description: 'Name of the APM repository',
    type: 'string',
    default: null,
  })
}

export const handler = async function({ reporter, environment, apmRepo }) {
  let versions

  const apmRepoName = getDefaultApmName(apmRepo)

  const tasks = new TaskList([
    {
      title: 'Fetching published versions',
      task: async (ctx, task) => {
        reporter.info(`Fetching ${bold(apmRepoName)} published versions`)

        const toolkit = Toolkit(environment)
        versions = await toolkit.apm.getAllVersions(apmRepoName)
      },
    },
  ])
  await tasks.run()

  reporter.newLine()
  displayVersionNumbers(apmRepoName, versions, reporter)
  displayVersions(versions, reporter)
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
    `${blue(apmRepoName)} has ${green(versions.length)} published versions`
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
    if (version && (version.contractAddress || version.contentUri)) {
      reporter.success(
        `${blue(version.version)}: ${version.contractAddress} ${
          version.contentUri
        }`
      )
    } else if (version && version.error) {
      reporter.warning(
        `${blue(version.version)}: ${version.contractAddress} ${version.error}`
      )
    } else {
      reporter.error(
        `${blue(version.version)}: ${
          version.contractAddress
        } Version not found in provider`
      )
    }
  })
}
