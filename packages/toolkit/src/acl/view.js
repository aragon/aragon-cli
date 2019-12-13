import '../../@types/acl/typedef'
import { initAragonJS, getApps } from '../helpers/aragonjs-wrapper'

// TODO: Stop using wrapper

/**
 * @typedef {Object} ReturnData
 * @property {AclPermissions} permissions
 * @property {App[]} apps
 * @property {string} daoAddress
 */

/**
 * Return a task list for viewing DAO ACL permissions
 *
 * @param  {Object} args From Listr
 * @param  {string} args.dao DAO address or ENS name
 * @param  {WebsocketProvider} args.web3Provider Web3 config
 * @param  {Object} args.ipfsConf IPFS config
 * @param  {ApmConfig} args.apm APM config
 * @return {Promise<ReturnData>} void
 */
export const getDaoAddressPermissionsApps = ({
  dao,
  web3Provider,
  ipfsConf,
  apm,
}) => {
  return new Promise((resolve, reject) => {
    /**
     * @type {AclPermissions}
     */
    let permissions
    /**
     * @type {App[]}
     */
    let apps
    /**
     * @type {string}
     */
    let daoAddress

    const resolveIfReady = () => {
      if (permissions && apps && daoAddress) {
        resolve({ permissions, apps, daoAddress })
      }
    }

    initAragonJS(dao, apm['ens-registry'], {
      provider: web3Provider,
      ipfsConf,
      onPermissions: _permissions => {
        permissions = _permissions
        resolveIfReady()
      },
      onDaoAddress: addr => {
        daoAddress = addr
        resolveIfReady()
      },
    })
      .then(async wrapper => {
        apps = await getApps(wrapper)
        resolveIfReady()
      })
      .catch(err => {
        err.message = `Error inspecting DAO ${err.message}`
        reject(err)
      })
  })
}
