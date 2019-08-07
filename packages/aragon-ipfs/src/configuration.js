import { WARNING_ICON } from '@aragon/cli-utils/dist/AragonReporter'

/**
 * CLI configuration
 */
export const SCRIPT_NAME = 'aragon ipfs'
export const EXAMPLE = `$0 install
$0 start
$0 status

ipfs --help
echo "hello" | ipfs add -q
ipfs pin ls

$0 view QmZULkCELmmk5XNfCgTnCyFgAVxBRBXyDHGGMVoLFLiXEN
$0 propagate QmZULkCELmmk5XNfCgTnCyFgAVxBRBXyDHGGMVoLFLiXEN

${WARNING_ICON} If you are experiencing connectivity issues with dist.ipfs.io, try:

$0 install --dist-url https://ipfs.eth.aragon.network/ipfs/QmVJL1ew9ytqZGR7Tg121tHEXPwbYVNxzHked3QzVgWEzD`
export const EPILOGUE = `Use '$0 <command> --help' to learn more about each command.
For more information, check out https://hack.aragon.org`
export const COMMAND_REQUIRED_ERROR = 'You need to specify a command'
export const HELP_COMMAND_WARNING = 'Use --help to show the available commands'

/**
 * Library configuration
 */
export const FETCH_TIMEOUT = 20000 // 20s
export const FETCH_TIMEOUT_ERR = 'Request timed out'

export const GATEWAYS = [
  'https://ipfs.io/ipfs',
  'https://ipfs.infura.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.eth.aragon.network/ipfs',
  'https://ipfs.jes.xxx/ipfs',
  'https://www.eternum.io/ipfs',
  'https://ipfs.wa.hle.rs/ipfs',
]

export const IPFS_START_TIMEOUT = 20000 // 20s for timeout, may need to be tweaked
