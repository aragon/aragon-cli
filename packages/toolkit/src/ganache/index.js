import path from 'path'

import { startProcess, noop, isPortTaken } from '../node'
import { DEVCHAIN_START_TIMEOUT } from './constants'

export const ensureDevchain = async ({ port, logger = noop }) => {
  if (await isPortTaken(port)) {
    logger(`Devchain already started on: ${port}`)
    return
  }

  const binPath = path.resolve(__dirname, '../../node_modules/.bin/aragen')

  logger(`Devchain starting on: ${port}`)
  try {
    const { detach } = await startProcess({
      cmd: 'node',
      args: [binPath, 'start', '--port', port],
      readyOutput: 'Devchain running at',
      execaOpts: {
        detached: true,
      },
      timeout: DEVCHAIN_START_TIMEOUT,
    })
    logger(`Devchain started on: ${port}`)
    logger('Devchain ready!!')
    detach()
  } catch (err) {
    logger('Devchain failed to start...')
  }
}
