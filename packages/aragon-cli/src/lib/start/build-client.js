import execa from 'execa'
import { getNodePackageManager } from '@aragon/toolkit/dist/node'

/**
 * Runs npm run build:local
 * @param {string} clientPath Client path
 */
export async function buildClient(clientPath) {
  const bin = getNodePackageManager()
  const cwd = clientPath
  // #### Question: Why is an error catched and rethrown?
  return execa(bin, ['run', 'build:local'], { cwd }).catch(err => {
    throw new Error(err)
  })
}
