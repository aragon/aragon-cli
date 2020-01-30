import { white } from 'chalk'
import TaskList from 'listr'
import { keyBy } from 'lodash'
import Table from 'cli-table'
import { keccak256 } from 'web3-utils'
import '@aragon/toolkit/@types/acl/typedef' // Load JSDoc types ACL specific
import '@aragon/toolkit/@types/typedef' // Load JSDoc generic types
import {
  ANY_ENTITY,
  NO_MANAGER,
  ZERO_ADDRESS,
  getDaoAddressPermissionsApps,
  formatAclPermissions,
  loadArappFile,
  useEnvironment,
} from '@aragon/toolkit'
//
import daoArg from '../utils/daoArg'
import { listApps } from '../utils/knownApps'
import listrOpts from '../../../helpers/listr-options'
import defaultAppsRoles from '../../../knownRoles.json'

export const command = 'view <dao>'
export const describe = 'Inspect permissions in a DAO'

export const builder = function(yargs) {
  return daoArg(yargs)
}

/**
 * Return a task list for viewing DAO ACL permissions
 *
 * @param  {Object} args From Listr
 * @param  {string} args.dao DAO address or ENS name
 * @param  {EnvironmentConfig} args.environment Environment config
 * @param  {boolean} args.silent Silent flag
 * @param  {boolean} args.debug Debug flag
 * @return {Promise<TaskList>} void
 */
export const handler = async function({ dao, environment, silent, debug }) {
  // Type common context
  /**
   * @type {AclPermissions}
   */
  let permissions
  /**
   * @type {App[]}
   */
  let apps

  const { appName } = useEnvironment(environment)

  // TODO: stop using appName

  const tasks = new TaskList(
    [
      {
        title: 'Inspecting DAO Permissions',
        task: async (_, task) => {
          task.output = `Fetching permissions for ${dao}...`

          const daoData = await getDaoAddressPermissionsApps(dao, environment)

          permissions = daoData.permissions
          apps = daoData.apps

          task.title = `Inspected DAO Permissions of ${daoData.daoAddress}`
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks.run().then(() => {
    const arapp = loadArappFile()

    const knownApps = listApps(arapp ? [appName] : [])
    const knownRoles = getKnownRoles(arapp)

    /**
     * @type {AclPermissionFormatted[]} Force type acknowledgment
     */
    const formatedAclPermissions = formatAclPermissions(
      permissions,
      apps,
      knownApps,
      knownRoles
    )

    // filter according to cli params will happen here

    const table = new Table({
      head: ['App', 'Action', 'Allowed entities', 'Manager'].map(x => white(x)),
    })

    for (const formatedAclPermission of formatedAclPermissions) {
      const { to, manager, allowedEntities, role } = formatedAclPermission

      // Ignore permissions with empty manager or allowed
      if (manager === ZERO_ADDRESS || !(allowedEntities || []).length) {
        continue
      }

      // 1 - To
      const toFormatted = printNameOrAddress(to)

      // 2 - Role
      const roleFormatted = role.id || shortHex(role.hash)

      // 3 - Allowed entities (multiline)
      const allowedFormatted = allowedEntities
        .map(allowedEntity =>
          (allowedEntity.address || '').toLowerCase() === ANY_ENTITY
            ? `🆓  Any entity`
            : `✅  ${printNameOrAddress(allowedEntity)}`
        )
        .join('\n')

      // 4 - Manager
      const managerFormatted =
        manager.address === NO_MANAGER
          ? `🆓  No manager`
          : printNameOrAddress(manager)

      table.push([
        toFormatted,
        roleFormatted,
        allowedFormatted,
        managerFormatted,
      ])
    }
    console.log('\n', table.toString())
  })
}

/**
 * Helper to short hex string for better readability
 * @param  {string} hex
 *         '0x76804359e7b668845d209f4a0391d5482a18c476'
 * @return {string}
 *         '0x768043..18c476'
 */
const shortHex = hex => {
  return `${hex.slice(0, 8)}..${hex.slice(-6)}`
}

/**
 * Helper to print out the short name of an app or its short address
 * @param  {AclPermissionAppInfo} appInfo App info
 * @return {string}
 *         'acl (0x5a10)' or '0x768043..18c476'
 */
const printNameOrAddress = ({ address, name }) =>
  name
    ? `${name.split('.')[0]} (${address.slice(0, 6)})`
    : `${shortHex(address)}`

/**
 * Returns this app roles and default known roles
 *
 * TODO: add support for user apps
 * @param {ArappConfig} arapp arapp.json contents
 * @return {Object.<string, RoleDefinition>} Unique known roles
 */
const getKnownRoles = arapp => {
  const currentAppRoles = arapp ? arapp.roles : []
  const allRoles = defaultAppsRoles.concat(currentAppRoles)

  return keyBy(allRoles, role => keccak256(role.id))
}
