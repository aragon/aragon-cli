import open from 'open'
import { isPortTaken } from '@aragon/cli-utils'

export async function openWrapper(ctx, clientPort) {
  // Check until the wrapper is served
  const checkWrapperReady = () => {
    setTimeout(async () => {
      const portTaken = await isPortTaken(clientPort)
      if (portTaken) {
        open(
          `http://localhost:${clientPort}/#/${
            ctx.daoAddress ? ctx.daoAddress : ''
          }`
        )
      } else {
        checkWrapperReady()
      }
    }, 250)
  }
  checkWrapperReady()
}
