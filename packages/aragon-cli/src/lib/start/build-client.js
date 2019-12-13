import execa from 'execa'
import { getNodePackageManager } from '@aragon/toolkit/dist/node'

export async function buildClient(ctx, clientPath) {
  const bin = getNodePackageManager()

  const startArguments = {
    cwd: clientPath || ctx.clientPath,
  }

  return execa(bin, ['run', 'build:local'], startArguments).catch(err => {
    throw new Error(err)
  })
}
