import execa from 'execa'
import path from 'path'
import { isPortTaken, getBinary, getPackageRoot } from '@aragon/toolkit'

export async function startClient(ctx, clientPort, clientPath) {
  if (await isPortTaken(clientPort)) {
    ctx.portOpen = true
    return
  }

  const packageRoot = getPackageRoot(__dirname)
  const bin = getBinary('http-server', packageRoot)

  const rootPath = clientPath || ctx.clientPath

  const startArguments = {
    cwd: path.join(rootPath, 'build'),
  }

  // TODO: Use -o option to open url. Will remove open dependency
  await execa(bin, ['-p', clientPort], startArguments)
}
