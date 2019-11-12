const { ensureWeb3 } = require('../../helpers/web3-fallback')
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')
const { ZERO_ADDRESS } = require('../../util')
const deploy = require('../deploy')
const propagateIPFS = require('../ipfs_cmds/propagate')

// Tasks splitted into other files
const runSetupTask = require('./publish/runSetupTask')
const runPrepareForPublishTask = require('./publish/runPrepareForPublishTask')
const runPublishTask = require('./publish/runPublishTask')

exports.command = 'publish <bump> [contract]'

exports.describe = 'Publish a new version of the application'

exports.builder = function(yargs) {
  return deploy
    .builder(yargs) // inherit deploy options
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
    .option('ipfs-check', {
      description: 'Whether to have publish start IPFS if not started',
      boolean: true,
      default: true,
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
      default: true,
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
exports.runSetupTask = runSetupTask
exports.runPrepareForPublishTask = runPrepareForPublishTask
exports.runPublishTask = runPublishTask

exports.handler = async function({
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
  // - Positional
  bump,
  contract,
  // - Options
  onlyArtifacts,
  reuse,
  provider,
  files,
  ignore,
  ipfsCheck,
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
    deployArtifacts,
  } = await runSetupTask({
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
    ipfsCheck,
    http,
  }).run()

  const { pathToPublish, intent } = await runPrepareForPublishTask({
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
    deployArtifacts,
  }).run()

  // Output publish info

  const { appName } = module
  const { dao, proxyAddress, methodName, params } = intent

  const contentURI = web3.utils.hexToAscii(params[params.length - 1])
  const [contentProvier, contentLocation] = contentURI.split(/:(.+)/)

  if (files.length === 1 && path.normalize(files[0]) === '.') {
    reporter.warning(
      `Publishing files from the project's root folder is not recommended. Consider using the distribution folder of your project: "--files <folder>".`
    )
  }

  console.log(
    '\n',
    `The following information will be published:`,
    '\n',
    `Contract address: ${chalk.blue(contractAddress || ZERO_ADDRESS)}`,
    '\n',
    `Content (${contentProvier}): ${chalk.blue(contentLocation)}`
    // TODO: (Gabi) Add extra relevant info (e.g. size)
    // `Size: ${chalk.blue()}`,
    // '\n',
    // `Number of files: ${chalk.blue()}`,
    // '\n'
  )

  if (contentProvier === 'ipfs') {
    console.log(
      '\n',
      'Explore the ipfs content locally:',
      '\n',
      chalk.bold(`http://localhost:5001/webui/#/explore/${contentLocation}`),
      '\n'
    )
  }

  if (!skipConfirmation) {
    const { confirmation } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmation',
        message: `${chalk.green(`Publish to ${appName} repo`)}`,
      },
    ])
    // new line after confirm
    console.log()
    if (!confirmation) process.exit()
  }

  const { receipt, transactionPath } = await runPublishTask({
    reporter,
    gasPrice,
    web3,
    wsProvider,
    module,
    apm: apmOptions,
    silent,
    debug,
    onlyArtifacts,
    onlyContent,
    // context
    dao,
    proxyAddress,
    methodName,
    params,
  }).run()

  const { transactionHash, status } = receipt

  if (!status) {
    reporter.error(`\nPublish transaction reverted:\n`)
  } else {
    // If the version is still the same, the publish intent was forwarded but not immediately executed (p.e. Voting)
    if (initialVersion === version) {
      console.log(
        '\n',
        `Successfully executed: "${chalk.green(
          transactionPath[0].description
        )}"`,
        '\n'
      )
    } else {
      const logVersion = 'v' + version

      console.log(
        '\n',
        `Successfully published ${appName} ${chalk.green(logVersion)} :`,
        '\n'
      )
    }
  }

  console.log(`Transaction hash: ${chalk.blue(transactionHash)}`, '\n')

  reporter.debug(`Published directory: ${chalk.blue(pathToPublish)}\n`)

  // Propagate content
  if (!http && propagateContent) {
    if (!skipConfirmation) {
      const { confirmation } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmation',
          message: chalk.green(`Propagate content`),
        },
      ])
      // new line after confirm
      console.log()
      if (!confirmation) process.exit()
    }

    const propagateTask = await propagateIPFS.task({
      apmOptions,
      cid: contentLocation,
      debug,
      silent,
    })

    const { CIDs, result } = await propagateTask.run()

    console.log(
      '\n',
      `Queried ${chalk.blue(CIDs.length)} CIDs at ${chalk.blue(
        result.gateways.length
      )} gateways`,
      '\n',
      `Requests succeeded: ${chalk.green(result.succeeded)}`,
      '\n',
      `Requests failed: ${chalk.red(result.failed)}`,
      '\n'
    )

    reporter.debug(`Gateways: ${result.gateways.join(', ')}`)
    reporter.debug(`Errors: \n${result.errors.map(JSON.stringify).join('\n')}`)
    // TODO: add your own gateways
  }
  process.exit()
}
