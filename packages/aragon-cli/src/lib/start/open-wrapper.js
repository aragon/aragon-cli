import opn from 'opn'
import { isPortTaken } from '../../util'

export async function openWrapper(dao, clientPort) {
  // Check until the wrapper is served
  const checkWrapperReady = () => {
    setTimeout(async () => {
      const portTaken = await isPortTaken(clientPort)
      if (portTaken) {
        opn(`http://localhost:${clientPort}/#/${dao || ''}`)
      } else {
        checkWrapperReady()
      }
    }, 250)
  }
  checkWrapperReady()
}
