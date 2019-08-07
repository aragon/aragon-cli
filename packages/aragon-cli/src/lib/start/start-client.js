import execa from 'execa'
import { isPortTaken, getNodePackageManager } from '@aragon/cli-utils'

export async function startClient(ctx, clientPort, clientPath) {
  if (await isPortTaken(clientPort)) {
    ctx.portOpen = true
    return
  }
  const bin = getNodePackageManager()
  const startArguments = {
    cwd: clientPath || ctx.wrapperPath,
    env: {
      REACT_APP_ENS_REGISTRY_ADDRESS: ctx.ens,
      REACT_APP_PORT: clientPort,
    },
  }

  execa(bin, ['run', 'start:local'], startArguments).catch(err => {
    throw new Error(err)
  })
}
