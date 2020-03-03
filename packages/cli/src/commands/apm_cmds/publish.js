import path from 'path'
import { blue, red, green, bold } from 'chalk'
import { ZERO_ADDRESS, getHttpClient } from '@aragon/toolkit'

// Tasks splitted into other files
import runSetupTask from './util/runSetupTask'
import runPrepareForPublishTask from './util/runPrepareForPublishTask'
import runPublishTask from './util/runPublishTask'

// helpers
import { ensureWeb3 } from '../../helpers/web3-fallback'

// util
import { askForConfirmation } from '../../util'

// cmds
import { builder as deployBuilder } from '../deploy'
import { runPropagateTask } from '../ipfs_cmds/propagate'

export const command = 'publish <bump> [contract]'

export const describe = 'Publish a new version of the application'

export const builder = function(yargs) {
  return deployBuilder(yargs) // inherit deploy options
    .positional('bump', {
      description: 'Type of bump (major, minor or patch) or version number',
      type: 'string',
    })
    .positional('contract', {
      description:
        "The address or name of the contract to publish in this version. If it isn't provided, it will default to the current version's contract.",
      type: 'string',
    })
    .option('init', {
      description: 'Arguments to be passed to contract constructor',
      array: true,
      default: [],
    })
    .option('only-artifacts', {
      description: 'Whether just generate artifacts file without publishing',
      default: false,
      boolean: true,
    })
    .option('provider', {
      description: 'The aragonPM storage provider to publish files to',
      default: 'ipfs',
      choices: ['ipfs'],
    })
    .option('reuse', {
      description:
        'Whether to reuse the previous version contract and skip deployment on non-major versions',
      default: false,
      boolean: true,
    })
    .option('files', {
      description:
        'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
      default: ['.'],
      array: true,
    })
    .option('ignore', {
      description:
        'A gitignore pattern of files to ignore. Specify multiple times to add multiple patterns.',
      array: true,
      default: ['node_modules'],
    })
    .option('publish-dir', {
      description:
        'Temporary directory where files will be copied before publishing. Defaults to temp dir.',
      default: null,
    })
    .option('only-content', {
      description:
        'Whether to skip contract compilation, deployment and contract artifact generation',
      default: false,
      boolean: true,
    })
    .option('build', {
      description:
        'Whether publish should try to build the app before publishing, running the script specified in --build-script',
      default: true,
      boolean: true,
    })
    .option('build-script', {
      description: 'The npm script that will be run when building the app',
      default: 'build',
    })
    .option('prepublish', {
      description:
        'Whether publish should run prepublish script specified in --prepublish-script before publishing',
      default: false,
      boolean: true,
    })
    .option('prepublish-script', {
      description: 'The npm script that will be run before publishing the app',
      default: 'prepublishOnly',
    })
    .option('http', {
      description: 'URL for where your app is served e.g. localhost:1234',
      default: null,
    })
    .option('http-served-from', {
      description:
        'Directory where your files is being served from e.g. ./dist',
      default: null,
    })
    .option('propagate-content', {
      description: 'Whether to propagate the content once published',
      boolean: true,
      default: true,
    })
    .option('skip-confirmation', {
      description: 'Whether to skip the confirmation step',
      boolean: true,
      default: false,
    })
}

// Re-export for compatibility with depedant modules
export const setupTask = runSetupTask
export const prepareForPublishTask = runPrepareForPublishTask
export const publishTask = runPublishTask

export const handler = async function({
  reporter,

  // Globals
  gasPrice,
  cwd,
  web3,
  network,
  wsProvider,
  module,
  apm: apmOptions,
  silent,
  debug,

  // Arguments

  bump,
  contract,
  onlyArtifacts,
  reuse,
  provider,
  files,
  ignore,
  publishDir,
  init,
  onlyContent,
  build,
  buildScript,
  prepublish,
  prepublishScript,
  http,
  httpServedFrom,
  propagateContent,
  skipConfirmation,
}) {
  web3 = web3 || (await ensureWeb3(network))

  const {
    initialRepo,
    initialVersion,
    version,
    contract: contractAddress,
  } = await (
    await runSetupTask({
      reporter,
      gasPrice,
      cwd,
      web3,
      network,
      module,
      apm: apmOptions,
      silent,
      debug,
      prepublish,
      prepublishScript,
      build,
      buildScript,
      bump,
      contract,
      init,
      reuse,
      onlyContent,
      onlyArtifacts,
      http,
    })
  ).run()

  const { pathToPublish, intent } = await (
    await runPrepareForPublishTask({
      reporter,
      cwd,
      web3,
      network,
      module,
      apm: apmOptions,
      silent,
      debug,
      publishDir,
      files,
      ignore,
      httpServedFrom,
      provider,
      onlyArtifacts,
      onlyContent,
      http,
      // context
      initialRepo,
      initialVersion,
      version,
      contractAddress,
    })
  ).run()

  // Output publish info

  const { appName } = module
  const { dao, proxyAddress, methodName, params } = intent

  const contentURI = web3.utils.hexToAscii(params[params.length - 1])
  const [contentProvier, contentLocation] = contentURI.split(/:(.+)/)

  if (files.length === 1 && path.normalize(files[0]) === '.') {
    reporter.newLine()
    reporter.warning(
      `Publishing files from the project's root folder is not recommended. Consider using the distribution folder of your project: "--files <folder>".`
    )
  }

  console.log(
    '\n',
    `The following information will be published:`,
    '\n',
    `Contract address: ${blue(contractAddress || ZERO_ADDRESS)}`,
    '\n',
    `Content (${contentProvier}): ${blue(contentLocation)}`,
    '\n'
    // TODO: (Gabi) Add extra relevant info (e.g. size)
    // `Size: ${blue()}`,
    // '\n',
    // `Number of files: ${blue()}`,
    // '\n'
  )

  if (contentProvier === 'ipfs') {
    reporter.debug(
      'Explore the ipfs content locally:',
      '\n',
      bold(
        `http://localhost:8080/ipfs/QmSDgpiHco5yXdyVTfhKxr3aiJ82ynz8V14QcGKicM3rVh/#/explore/${contentLocation}`
      ),
      '\n'
    )
  }

  if (!skipConfirmation) {
    const reply = await askForConfirmation(
      `${green(`Publish to ${appName} repo`)}`
    )
    console.log()
    // new line after confirm
    if (!reply) return console.log()
  }

  const { receipt, transactionPath } = await (
    await runPublishTask({
      reporter,
      gasPrice,
      web3,
      wsProvider,
      module,
      network,
      http,
      provider,
      apm: apmOptions,
      silent,
      debug,
      onlyArtifacts,
      onlyContent,
      // context
      version,
      pathToPublish,
      contractAddress,
      dao,
      proxyAddress,
      methodName,
      params,
    })
  ).run()

  const { transactionHash, status } = receipt

  if (!status) {
    reporter.error(`\nPublish transaction reverted:\n`)
  } else {
    // If the version is still the same, the publish intent was forwarded but not immediately executed (p.e. Voting)
    if (initialVersion === version) {
      console.log(
        '\n',
        `Successfully executed: "${green(transactionPath[0].description)}"`,
        '\n'
      )
    } else {
      const logVersion = 'v' + version

      console.log(
        '\n',
        `Successfully published ${appName} ${green(logVersion)} :`,
        '\n'
      )
    }
  }

  console.log(`Transaction hash: ${blue(transactionHash)}`, '\n')

  reporter.debug(`Published directory: ${blue(pathToPublish)}\n`)

  // Propagate content
  if (!http && propagateContent) {
    if (!skipConfirmation) {
      const reply = await askForConfirmation(green(`Propagate content`))
      // new line after confirm
      if (!reply) return console.log()
    }

    const ipfsReader = await getHttpClient(apmOptions.ipfs.gateway)

    const { CIDs, result } = await runPropagateTask({
      ipfsReader,
      cid: contentLocation,
      debug,
      silent,
    })

    console.log(
      '\n',
      `Queried ${blue(CIDs.length)} CIDs at ${blue(
        result.gateways.length
      )} gateways`,
      '\n',
      `Requests succeeded: ${green(result.succeeded)}`,
      '\n',
      `Requests failed: ${red(result.failed)}`,
      '\n'
    )

    reporter.debug(`Gateways: ${result.gateways.join(', ')}`)

    if (result.errors && result.errors.length) {
      reporter.debug(
        `Errors: \n${result.errors.map(JSON.stringify).join('\n')}`
      )
    }
    // TODO: add your own gateways
  }
}
