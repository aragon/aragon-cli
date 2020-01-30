import { blue } from 'chalk'
import { grantNewVersionsPermission, useEnvironment } from '@aragon/toolkit'

export const command = 'grant [grantees..] [apmRepo]'
export const describe =
  'Grant an address permission to create new versions in this package'

export const builder = function (yargs) {
  return yargs
    .positional('grantees', {
      description:
        'The address being granted the permission to publish to the repo',
      array: true,
      default: [],
    })
    .option('apmRepo', {
      description: 'Name of the APM repository',
      type: 'string',
      default: null,
    })
}

export const handler = async function ({
  // Globals
  reporter,
  environment,
  // Arguments
  grantees,
  apmRepo,
}) {

  const { appName } = useEnvironment()

  // TODO: Stop using appName

  const appRepoName = apmRepo || appName

  const progressHandler = (step, data) => {
    switch (step) {
      case 1:
        reporter.info(`Fetching repository`)
        break
      case 2:
        // eslint-disable-next-line no-case-declarations
        const address = data
        reporter.info(
          `Granting permission to publish on ${blue(
            appRepoName
          )} for ${address}`
        )
        break
      case 3:
        // eslint-disable-next-line no-case-declarations
        const txHash = data
        reporter.success(`Successful transaction (${blue(txHash)})`)
        break
    }
  }

  await grantNewVersionsPermission(
    grantees,
    appRepoName,
    progressHandler,
    environment
  )
}
