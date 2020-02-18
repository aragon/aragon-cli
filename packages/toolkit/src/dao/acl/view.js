import '../../../@types/acl/typedef'
import { initWrapper } from '../../helpers/wrapper'

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
 * @param  {string} args.dao DAO address or ENS name
 * @param  {string} environment Envrionment
 * @return {Promise<ReturnData>} void
 */
export const getDaoAddressPermissionsApps = (dao, environment) => {
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

    initWrapper(dao, environment, {
      // Permissions Object:
      // { app -> role -> { manager, allowedEntities -> [ entities with permission ] } }
      onPermissions: _permissions => {
        permissions = _permissions
        resolveIfReady()
      },
      onDaoAddress: addr => {
        daoAddress = addr
        resolveIfReady()
      },
      onApps: _apps => {
        apps = _apps
        resolveIfReady()
      },
    }).catch(err => {
      err.message = `Error inspecting DAO ${err.message}`
      reject(err)
    })
  })
}
