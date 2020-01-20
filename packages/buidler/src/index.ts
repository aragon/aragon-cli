import { extendConfig } from '@nomiclabs/buidler/config'
import { ResolvedBuidlerConfig, BuidlerConfig } from '@nomiclabs/buidler/types'
import defaultAragonConfig from './config'

export default function(): void {
  // Task definitions.
  require('./src/tasks/start/start-task')

  // Environment extensions.
  // No extensions atm.

  // Default configuration values.
  extendConfig((finalConfig: any, userConfig: any) => {
    finalConfig = {
      ...defaultAragonConfig,
      ...userConfig
    }
  })
}
