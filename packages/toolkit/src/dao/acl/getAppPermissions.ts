import { initWrapper } from '../utils/wrapper'
import { AragonApp, AclPermissions } from '../../types'

// TODO: Stop using wrapper

/**
 * Retrieve DAO ACL permissions
 * @param dao DAO address or ENS name
 * @param environment Envrionment
 */
export function getAppPermissions(
  dao: string,
  environment: string
): Promise<{
  permissions: AclPermissions[]
  apps: AragonApp[]
  daoAddress: string
}> {
  return new Promise((resolve, reject) => {
    let permissions: AclPermissions[] | undefined
    let apps: AragonApp[] | undefined
    let daoAddress: string | undefined

    const resolveIfReady = (): void => {
      if (permissions && apps && daoAddress) {
        resolve({ permissions, apps, daoAddress })
      }
    }

    initWrapper(dao, environment, {
      // Permissions Object:
      // { app -> role -> { manager, allowedEntities -> [ entities with permission ] } }
      onPermissions: (_permissions: AclPermissions[]) => {
        permissions = _permissions
        resolveIfReady()
      },
      onDaoAddress: (addr: string) => {
        daoAddress = addr
        resolveIfReady()
      },
      onApps: (_apps: AragonApp[]) => {
        apps = _apps
        resolveIfReady()
      },
    }).catch(err => {
      err.message = `Error inspecting DAO ${err.message}`
      reject(err)
    })
  })
}
