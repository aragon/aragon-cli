import { resetBuidlerContext } from '@nomiclabs/buidler/plugins-testing'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import path from 'path'

declare module 'mocha' {
  interface Context {
    env: BuidlerRuntimeEnvironment
  }
}

export function useDefaultEnvironment(): void {
  useEnvironment(path.join(__dirname, '../buidler-project'))
}

export function useEnvironment(
  projectPath: string,
  networkName = 'localhost'
): void {
  before('loading buidler environment', function() {
    process.chdir(projectPath)
    process.env.BUIDLER_NETWORK = networkName

    this.env = require('@nomiclabs/buidler')
  })

  after('resetting buidler', function() {
    resetBuidlerContext()
    delete process.env.BUIDLER_NETWORK
  })
}
