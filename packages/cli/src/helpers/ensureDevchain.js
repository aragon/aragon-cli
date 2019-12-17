import path from 'path'
import { startProcess, noop, isPortTaken } from '@aragon/toolkit/dist/node'
//
import { DEVCHAIN_START_TIMEOUT } from '../commands/devchain_cmds/utils/constants'

export const ensureDevchain = async ({ port, logger = noop }) => {
  if (await isPortTaken(port)) {
    logger(`Devchain already started on: ${port}`)
    return
  }

  const binPath = path.resolve(__dirname, '../cli.js')

  logger(`Devchain starting on: ${port}`)
  try {
    const { detach } = await startProcess({
      cmd: 'node',
      args: [binPath, 'devchain', '--port', port],
      readyOutput: 'Devchain running at',
      execaOpts: {
        detached: true,
      },
      timeout: DEVCHAIN_START_TIMEOUT,
    })
    console.log()
    logger(`Devchain started on: ${port}`)
    logger('Devchain ready!!')
    detach()
  } catch (err) {
    logger('Devchain failed to start...')
    logger(`Error: ${err}`)
  }
}
