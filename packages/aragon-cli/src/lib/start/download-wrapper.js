import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import { promisify } from 'util'
const clone = promisify(require('git-clone'))

export async function downloadWrapper(ctx, task, clientVersion) {
  const CLIENT_PATH = `${os.homedir()}/.aragon/wrapper-${clientVersion}`
  ctx.wrapperPath = CLIENT_PATH

  // Make sure we haven't already downloaded the wrapper
  if (fs.existsSync(path.resolve(CLIENT_PATH))) {
    task.skip('Wrapper already downloaded')
    ctx.wrapperAvailable = true
    return
  }

  // Ensure folder exists
  fs.ensureDirSync(CLIENT_PATH)

  // Clone wrapper
  return clone('https://github.com/aragon/aragon', CLIENT_PATH, {
    checkout: clientVersion,
  })
}
