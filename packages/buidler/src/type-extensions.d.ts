import { AragonConfig } from './types'

declare module '@nomiclabs/buidler/types' {
  interface BuidlerConfig {
    aragon?: AragonConfig
  }
}
