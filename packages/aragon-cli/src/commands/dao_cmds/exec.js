const execHandler = require('./utils/execHandler').handler
const daoArg = require('./utils/daoArg')
const { parseArgumentStringIfPossible, addressesEqual } = require('../../util')
const { map, filter, first } = require('rxjs/operators')

exports.command = 'exec <dao> <proxy-address> <fn> [fn-args..]'

exports.describe = 'Executes a call in an app of a DAO'

exports.builder = function(yargs) {
  return daoArg(yargs)
    .positional('proxy-address', {
      description: 'Proxy address of the app with the function to be run',
    })
    .positional('fn', {
      description: 'Function to be executed',
    })
    .option('fn-args', {
      description: 'Arguments to be passed to the function',
      array: true,
      default: [],
    })
}

exports.handler = async function({
  reporter,
  dao,
  apm,
  network,
  proxyAddress,
  fn,
  fnArgs,
  wsProvider,
}) {
  // TODO (daniel) refactor ConsoleReporter so we can do reporter.debug instead
  if (global.DEBUG_MODE) console.log('fn-args before parsing', fnArgs)
  fnArgs = fnArgs.map(parseArgumentStringIfPossible)
  if (global.DEBUG_MODE) console.log('fn-args after parsing', fnArgs)

  const getTransactionPath = async wrapper => {
    // Wait for app info to load
    await wrapper.apps.pipe(
      map(apps => apps.find(app => addressesEqual(app.proxyAddress, proxyAddress))),
      filter(app => app),
      first()
    ).toPromise()
    
    return wrapper.getTransactionPath(proxyAddress, fn, fnArgs)
  }
  return execHandler(dao, getTransactionPath, {
    ipfsCheck: true,
    reporter,
    apm,
    network,
    wsProvider,
  })
}
