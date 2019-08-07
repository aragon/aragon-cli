import defaultEnvironments from '../config/environments.default'
import { askForChoice } from './index'

export const OPTIONS = {
  'environment': {
    description: 'The environment in which to run the command'
  },
  'eth-node': {
    description: 'The ETH node to read data from'
  },
  'web3-signer': {
    description: 'The ETH node to send transactions to'
  },
  'ens-registry': {
    description: 'The ENS registry address'
  },
  'gas-price': {
    description: 'The transaction gas price (in Wei)'
  },
  'ipfs-node': {
    description: 'The IPFS node to send data to'
  },
  'ipfs-gateway': {
    description: 'The IPFS gateway to read data from'
  }
}

export const configure = (yargs, options) => yargs
  .options(OPTIONS)
  .alias('env', 'environment')
  .group(Object.keys(OPTIONS), 'Environment:')
  .middleware([
    (argv) => middleware(argv, options)
  ])

export const middleware = async (argv, options) => {
  if (shouldBeSkipped(argv, options)) return

  const { reporter, arapp } = argv
  const environments = arapp ? arapp.environments : defaultEnvironments

  let { environment: environmentName } = argv
  if (!environmentName) {
    environmentName = await askForChoice('Choose an environment', Object.keys(environments))
  }

  let environment = getEnvironmentObject(environments, environmentName)

  environment = {
    name: environmentName,
    ethNode: argv.ethNode || environment.ethNode,
    ethSigner: argv.ethSigner || environment.ethSigner,
    ensRegistry: argv.ensRegistry || environment.ensRegistry,
    gasPrice: argv.gasPrice || environment.gasPrice,
    ipfsNode: argv.ipfsNode || environment.ipfsNode,
    ipfsGateway: argv.ipfsGateway || environment.ipfsGateway
  }

  reporter.debug('AragonEnvironment: environment')
  reporter.debug(environment)
  return { environment }
}

const getEnvironmentObject = (environments, environmentName) => {
  let environment = environments[environmentName]

  if (!environment) {
    throw new Error(`Cannot find "${environmentName}" in arapp.json`)
  }

  return extendEnvironment(environments, environment)
}

const extendEnvironment = (environments, environment) => {
  if (environment.extends) {
    let parent = environments[environment.extends]

    if (!parent) {
      throw new Error(`Cannot find "${environment.extends}" in arapp.json`)
    }

    // oh no, this environment extends something as well
    if (parent.extends) {
      parent = extendEnvironment(environments, parent)
    }

    return Object.assign({}, parent, environment)
  } else {
    return environment
  }
}

const shouldBeSkipped = (argv, options) => {
  // todo runOn
  const { skipOn = [] } = options
  const currentCommand = argv._[0]
  return skipOn.includes(currentCommand)
}
