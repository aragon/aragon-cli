import { connect, App } from '@aragon/connect'
import { useEnvironment } from '../../useEnvironment'
import { kernelAbi } from '../../contractAbis'

type AragonApp = any

/**
 * Return installed apps for a DAO
 *
 * @param dao DAO address
 * @param environment Envrionment
 * @returns Installed apps
 */
export async function getInstalledApps(
  dao: string,
  environment: string
): Promise<App[]> {
  const { chainId } = useEnvironment(environment)

  const org = await connect(dao, 'thegraph', { chainId })

  const apps = await org.apps()

  const installedApps = apps.filter(async app => {
    const roles = await app.roles()
    const permission = roles.find(roles => roles.permissions)
  })

  return org.apps()
}

/**
 * Return all apps in a DAO, including permissionless ones
 *
 * @param dao DAO address
 * @param environment Envrionment
 * @returns All apps
 */
export async function getAllApps(
  dao: string,
  environment: string
): Promise<App[]> {
  const { chainId } = useEnvironment(environment)

  const org = await connect(dao, 'thegraph', { chainId })

  return org.apps()
}
