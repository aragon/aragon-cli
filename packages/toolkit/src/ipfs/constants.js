export const GATEWAY_FETCH_TIMEOUT = 20000 // 20s
export const GATEWAY_FETCH_TIMEOUT_MSG = 'Request timed out'

export const DEFAULT_GATEWAYS = [
  'https://ipfs.io/ipfs',
  'https://ipfs.infura.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.eth.aragon.network/ipfs',
  'https://ipfs.jes.xxx/ipfs',
  'https://www.eternum.io/ipfs',
  'https://ipfs.wa.hle.rs/ipfs',
]

export const DAEMON_START_TIMEOUT = 20000 // 20s
export const DAEMON_READY_OUTPUT = 'Daemon is ready'
export const DEFAULT_DAEMON_ARGS = ['--migrate']

export const NO_INSTALLATION_MSG =
  'IPFS is not installed. Use `aragon ipfs install` before proceeding.'

export const GO_IMPL_DIST_VERSION = '0.4.22'
export const GO_IMPL_DIST_URL = 'https://dist.ipfs.io'
