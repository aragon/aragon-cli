import execa from 'execa'
import path from 'path'
import { isPortTaken, getBinary } from '../../util'

export async function startClient(ctx, clientPort, clientPath) {
  if (await isPortTaken(clientPort)) {
    ctx.portOpen = true
    return
  }
  const bin = getBinary('http-server')

  const rootPath = clientPath || ctx.clientPath

  const startArguments = {
    cwd: path.join(rootPath, 'build'),
  }

  // TODO: Use -o option to open url. Will remove open dependency
  execa(bin, ['-p', clientPort], startArguments).catch(err => {
    throw new Error(err)
  })
}
