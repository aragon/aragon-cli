import { takeWhile } from 'rxjs/operators'
import { abi as kernelAbi } from '@aragon/abis/os/artifacts/Kernel'
//
import { resolveEnsDomain } from '../helpers/resolveAddressOrEnsDomain'
import { useEnvironment } from '../helpers/useEnvironment'
import { initWrapper } from '../helpers/wrapper'

/**
 * Return installed apps for a DAO
 *
 * @param {string} dao DAO address
 * @param {string} environment Envrionment
 * @returns {Promise<Object[]>} Installed apps
 */
export async function getInstalledApps(dao, environment) {
  const wrapper = await initWrapper(dao, environment)
  return (
    wrapper.apps
      // If the app list contains a single app, wait for more
      .pipe(takeWhile(apps => apps.length <= 1, true))
      .toPromise()
  )
}

/**
 * Return all apps in a DAO, including permissionless ones
 *
 * @param {string} dao DAO address
 * @param {string} environment Envrionment
 * @returns {Promise<Object[]>} All apps
 */
export async function getAllApps(dao, environment) {
  const { web3 } = useEnvironment(environment)

  const kernel = new web3.eth.Contract(kernelAbi, dao)

  const events = await kernel.getPastEvents('NewAppProxy', {
    fromBlock: await kernel.methods.getInitializationBlock().call(),
    toBlock: 'latest',
  })

  return events.map(event => ({
    proxyAddress: event.returnValues.proxy,
    appId: event.returnValues.appId,
  }))
}

/**
 * Return a DAO address from its subdomain
 *
 * @param {string} dao DAO subdomain
 * @param {Object} options Options
 * @param {Object} options.provider ETH provider
 * @param {string} options.registryAddress ENS registry address
 */
export async function getDaoAddress(dao, options) {
  return /[a-z0-9]+\.eth/.test(dao) ? resolveEnsDomain(dao, options) : dao
}
