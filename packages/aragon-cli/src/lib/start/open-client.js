import open from 'open'
import { isPortTaken } from '../../util'

/**
 * Open the default browser to the Aragon client's URL
 * Checks until the client is served
 * @param {string|number} clientPort "3001"
 * @param {string} daoAddress "0xabcd1234..."
 */
export async function openClient(clientPort, daoAddress) {
  const checkClientReady = () => {
    setTimeout(async () => {
      const portTaken = await isPortTaken(clientPort)
      if (portTaken) {
        open(`http://localhost:${clientPort}/#/${daoAddress || ''}`)
      } else {
        checkClientReady()
      }
    }, 250)
  }
  checkClientReady()
}
