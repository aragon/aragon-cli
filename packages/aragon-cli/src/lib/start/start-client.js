import execa from 'execa'
import path from 'path'
import { getBinary } from '@aragon/toolkit'

/**
 * Starts an HTTP webserver for the client UI build files
 * @param {string|number} clientPort "3000"
 * @param {string} clientPath Client path
 */
export async function startClient(clientPort, clientPath) {
  const bin = getBinary('http-server')
  const cwd = path.join(clientPath, 'build')

  // import { isPortTaken, getBinary, getPackageRoot } from '@aragon/toolkit'

  // export async function startClient(ctx, clientPort, clientPath) {
  //   if (await isPortTaken(clientPort)) {
  //     ctx.portOpen = true
  //     return
  //   }

  //   const packageRoot = getPackageRoot(__dirname)
  //   const bin = getBinary('http-server', packageRoot)

  //   const rootPath = clientPath || ctx.clientPath

  //   const startArguments = {
  //     cwd: path.join(rootPath, 'build'),
  //   }

  // TODO: Use -o option to open url. Will remove open dependency
  execa(bin, ['-p', clientPort], { cwd }).catch(err => {
    throw new Error(err)
  })
}
