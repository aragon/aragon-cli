import { connect, App, Permission } from '@aragon/connect'
import { useEnvironment } from '../../useEnvironment'

/**
 * Retrieve DAO ACL permissions
 * @param dao DAO address or ENS name
 * @param environment Envrionment
 */
export async function getAppPermissions(
  dao: string,
  environment: string
): Promise<{
  permissions: Permission[]
  apps: App[]
  daoAddress: string
}> {
  const { chainId } = useEnvironment(environment)

  const org = await connect(dao, 'thegraph', { chainId })

  const apps = await org.apps()
  const permissions = await org.permissions()

  return { permissions, apps, daoAddress: org.address }
}
