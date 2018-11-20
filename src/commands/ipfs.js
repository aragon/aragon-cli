const path = require('path')
const TaskList = require('listr')
const {
  startIPFSDaemon,
  isIPFSCORS,
  setIPFSCORS,
  isIPFSRunning
} = require('../helpers/ipfs-daemon')

const IPFS = require('ipfs-api')
const listrOpts = require('../helpers/listr-options')

exports.command = 'ipfs'

exports.describe = 'Start IPFS daemon configured to work with Aragon'

exports.task = ({ apmOptions, silent, debug }) => {
  return new TaskList([
    {
      title: 'Start IPFS',
      task: async (ctx, task) => {
        // If the dev manually set their IPFS node, skip install and running check
        if (apmOptions.ipfs.rpc.default) {
          const running = await isIPFSRunning(apmOptions.ipfs.rpc)
          if (!running) {
            task.output = 'Starting IPFS at port: ' + apmOptions.ipfs.rpc.port
            await startIPFSDaemon()
            ctx.started = true
            await setIPFSCORS(apmOptions.ipfs.rpc)
          } else {
            task.output = 'IPFS is started, checking CORS config'
            await setIPFSCORS(apmOptions.ipfs.rpc)
            return 'Connected to IPFS daemon at port: ' + apmOptions.ipfs.rpc.port
          }
        } else {
          await isIPFSCORS(apmOptions.ipfs.rpc)
          return 'Connecting to provided IPFS daemon'
        }
      }
    },
    {
      title: 'Add local files',
      task: (ctx) => {
        const ipfs = IPFS('localhost', '5001', { protocol: 'http' })
        const files = path.resolve(require.resolve('@aragon/aragen'), '../ipfs-cache')

        return new Promise((resolve, reject) => {
          ipfs.util.addFromFs(files, { recursive: true, ignore: 'node_modules' }, (err, files) => {
            if (err) return reject(err)
            resolve(files)
          })
        })
      }
    }
  ],
    listrOpts(silent, debug)
  )
}

exports.handler = function ({ reporter, apm: apmOptions }) {
  const task = exports.task({ apmOptions })

  task.run()
    .then(ctx => {
      if (ctx.started) {
        reporter.info('IPFS daemon is now running. Stopping this process will stop IPFS')
      } else {
        reporter.warning('Didnt start IPFS, port busy')
        process.exit()
      }
    })
    .catch(err => {
      reporter.error(err)
      process.exit(1)
    })
}
