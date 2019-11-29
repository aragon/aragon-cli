import execa from 'execa'
import path from 'path'
import { getBinary } from '../../util'

/**
 * Starts an HTTP webserver for the client UI build files
 * @param {string|number} clientPort "3000"
 * @param {string} clientPath Client path
 */
export async function startClient(clientPort, clientPath) {
  const bin = getBinary('http-server')
  const cwd = path.join(clientPath, 'build')
  // TODO: Use -o option to open url. Will remove open dependency
  execa(bin, ['-p', clientPort], { cwd }).catch(err => {
    throw new Error(err)
  })
}
