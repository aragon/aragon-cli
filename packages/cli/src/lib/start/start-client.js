import execa from 'execa'
import path from 'path'
import fs from 'fs-extra'
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
    cwd: (await fs.pathExists(path.join(rootPath, 'build')))
      ? path.join(rootPath, 'build')
      : path.join(rootPath, 'public'),
  }

  // TODO: Use -o option to open url. Will remove open dependency
  execa(bin, ['-p', clientPort], startArguments).catch((err) => {
    throw new Error(err)
  })
}
