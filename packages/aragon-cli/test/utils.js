import util from 'util'
import * as child from 'child_process'
import Web3 from 'web3'
import execa from 'execa'

const defaultTimeout = 15 * 60 * 1000 // ms

const exec = util.promisify(child.exec)

export const isValidTxHash = txHash => /^0x([A-Fa-f0-9]{64})$/.test(txHash)
export const isAddress = Web3.utils.isAddress

export const getLocalWeb3 = async () => {
  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(`ws://localhost:8545`)
  )
  const connected = await web3.eth.net.isListening()
  if (!connected) throw new Error('Web3 connection failed')
  return web3
}

/**
 *
 * Run a command using the freshly compiled aragonCLI build from the "dist" folder.
 *
 * @param {Array<string>} args the arguments to call the CLI with, e.g.: ['dao', 'new']
 * @return {Promise<string>} stdout
 */
export const runAragonCLI = async args => {
  const { stdout } = await execa('node', ['dist/cli.js', ...args])
  return stdout
}

/**
 * Deploys a new DAO calling 'aragon dao new' and returns it's address
 * @return {Promise<string>} daoAddress
 */
export const getNewDaoAddress = async () => {
  const daoNewRes = await runAragonCLI(['dao', 'new'])
  const dao = (daoNewRes.split('DAO: ')[1] || '').trim()
  if (!isAddress(dao))
    throw Error(`Error parsing aragon dao new output: ${daoNewRes}`)
  return dao
}

/**
 * Run arbitrary commands in a host shell
 *
 * If timeout is greater than 0, the parent will send the signal
 * identified by the killSignal property (the default is 'SIGTERM')
 * if the child runs longer than timeout milliseconds.
 *
 * NOTE: On error (including any error resulting in an exit code other than 0),
 * The Error object has two additional properties: stdout and stderr.
 *
 * @param {string} cmd Command to run in shell
 * @param {Object} [options] Options object
 * @param {number} [options.number] Timeout in ms
 * @return {Promise<string>}
 */
export async function shell(cmd, options) {
  const timeout = options && options.timeout ? options.timeout : defaultTimeout
  return exec(cmd, { timeout })
    .then(res => (res.stdout || '').trim())
    .catch(err => {
      if (err.signal === 'SIGTERM') {
        throw Error(`cmd "${err.cmd}" timed out (${timeout} ms)`)
      }
      throw err
    })
}

/**
 * Installs IPFS if necessary. If IPFS is already installed, returns void
 *
 * @return {Promise<void>}
 */
export async function installIpfsIfNecessary() {
  try {
    await shell(`npx aragon ipfs install`)
  } catch (e) {
    if (!e.message.includes('already installed')) throw e
  }
}

export async function assertIpfsIsInstalled() {
  try {
    await shell(`ipfs version`)
  } catch (e) {
    throw Error(`IPFS is not installed: ${e.message}`)
  }
}
