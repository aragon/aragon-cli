import { startProcess, noop, isPortTaken } from '../node'
import { DEVCHAIN_START_TIMEOUT } from './constants'

export const ensureDevchain = async ({ port, logger = noop }) => {
  if (await isPortTaken(port)) {
    logger(`Devchain already started on: ${port}`)
    return
  }

  logger(`Devchain starting on: ${port}`)
  const { detach } = await startProcess({
    cmd: 'node',
    args: ['node_modules/.bin/aragen', 'start', '--port', port],
    readyOutput: 'Devchain running at',
    execaOpts: {
      detached: true,
    },
    timeout: DEVCHAIN_START_TIMEOUT,
  })
  logger(`Devchain started on: ${port}`)
  logger('Devchain ready!!')
  detach()
}
