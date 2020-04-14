import execa from 'execa'
//
import { noop, getNodePackageManager } from '../node'
import { GO_IMPL_DIST_URL, GO_IMPL_DIST_VERSION } from './constants'

export const installGoIpfs = async (
  local,
  location,
  distVersion = GO_IMPL_DIST_VERSION,
  distUrl = GO_IMPL_DIST_URL,
  options = {}
) => {
  const { logger = noop } = options

  const npmBinary = getNodePackageManager()
  const exacaOptions = {
    cwd: local ? location : undefined,
    env: {
      /*
       *  https://github.com/ipfs/npm-go-ipfs-dep/blob/v0.4.21/src/index.js#L71
       */
      GO_IPFS_DIST_URL: distUrl,
      /*
       *  specifying `TARGET_VERSION` here, will throw an error, because:
       *  https://github.com/ipfs/npm-go-ipfs/blob/master/link-ipfs.js#L49
       */
      // TARGET_VERSION: distVersion
    },
  }
  const npmArgs = [
    'install',
    `go-ipfs@${distVersion}`,
    local ? '--save' : '--global',
  ]

  const logPrefix = `npm ${npmArgs.join(' ')}:`
  const installProcess = execa(npmBinary, npmArgs, exacaOptions)

  installProcess.stdout.on('data', (data) => {
    if (data) logger(`${logPrefix} ${data}`)
  })

  try {
    return await installProcess
  } catch (err) {
    if (err.stderr && err.stderr.includes('No matching version found')) {
      throw new Error(
        `NPM cannot find version ${distVersion}. For more versions see: http://npmjs.com/package/go-ipfs?activeTab=versions`
      )
    } else {
      throw new Error(err)
    }
  }
}
