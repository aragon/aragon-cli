import path from 'path'
import { existsSync, ensureDirSync } from 'fs-extra'
import os from 'os'
import { promisify } from 'util'
const clone = promisify(require('git-clone'))

export async function downloadClient(ctx, task, clientVersion) {
  const CLIENT_PATH = `${os.homedir()}/.aragon/client-${clientVersion}`
  ctx.clientPath = CLIENT_PATH

  // Make sure we haven't already downloaded the Client
  if (existsSync(path.resolve(CLIENT_PATH))) {
    task.skip('Client already downloaded')
    ctx.clientAvailable = true
    return
  }

  // Ensure folder exists
  ensureDirSync(CLIENT_PATH)

  // Clone client
  return clone('https://github.com/aragon/aragon', CLIENT_PATH, {
    checkout: clientVersion,
  })
}
