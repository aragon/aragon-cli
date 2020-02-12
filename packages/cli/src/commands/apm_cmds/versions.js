import { green, blue, bold } from 'chalk'
import TaskList from 'listr'
import { useApm, defaultAPMName } from '@aragon/toolkit'

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
  let versions, apmRepoName

  const apm = await useApm(environment)

  const tasks = new TaskList([
    {
      title: 'Fetching published versions',
      task: async (ctx, task) => {
        apmRepoName = apmRepo ? defaultAPMName(apmRepo) : null

        reporter.info(`Fetching ${bold(apmRepoName)} published versions`)

        versions = await apm.getAllVersions(apmRepoName)
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
    if (version && version.content) {
      reporter.success(
        `${blue(version.version)}: ${version.contractAddress} ${
          version.content.provider
        }:${version.content.location}`
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
