import { extendConfig } from '@nomiclabs/buidler/config'
import defaultAragonConfig from './config'
// TODO: Don't use any type below, try to use something like these...
// import { ResolvedBuidlerConfig, BuidlerConfig } from '@nomiclabs/buidler/types'

export default function(): void {
  // Task definitions.
  require(__dirname + '/tasks/start/start-task')

  // Environment extensions.
  // No extensions atm.

  // Default configuration values.
  extendConfig((finalConfig: any, userConfig: any) => {
    finalConfig.aragon = {
      ...defaultAragonConfig,
      ...userConfig.aragon
    }
  })
}
