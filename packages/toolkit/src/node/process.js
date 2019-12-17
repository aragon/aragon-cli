import execa from 'execa'
import { promisify } from 'util'
import psTree from 'ps-tree'
//
import { withTimeout, noop } from './misc'

export const defaultKillSignal = 'SIGINT'

export const getProcessTree = subprocess => promisify(psTree)(subprocess.pid)

export const killProcessTree = async (subprocess, { logger = noop }) => {
  const { children } = await getProcessTree(subprocess)

  if (!children) {
    return
  }

  children.forEach(child => {
    // each child has the properties: COMMAND, PPID, PID, STAT
    logger(`killing process with PID ${child.pid}, child of ${subprocess.pid}`)
    process.kill(child.PID, defaultKillSignal)
  })
}

export const attachProcess = subprocess => {
  subprocess.stdout.pipe(process.stdout)
  subprocess.stderr.pipe(process.stderr)
  process.stdin.pipe(subprocess.stdin)
}

export const detachProcess = subprocess => {
  subprocess.stderr.destroy()
  subprocess.stdout.destroy()
  subprocess.stdin.destroy()
  subprocess.unref()
}

export const startProcess = async ({
  cmd,
  args,
  execaOpts = {},
  readyOutput,
  timeout,
  logger = noop,
}) => {
  let output = ''

  const request = new Promise((resolve, reject) => {
    const subprocess = execa(cmd, args, execaOpts)
    logger('spawned subprocess with PID: ', subprocess.pid)

    subprocess.stderr.on('data', data => {
      data = data.toString()
      logger(`stderr: ${data}`)
      if (!data.includes('DeprecationWarning')) reject(new Error(data))
    })

    subprocess.stdout.on('data', data => {
      data = data.toString()
      logger(`stdout: ${data}`)
      // build the output log (to be able to err out if the time is up)
      output = `${output}${data}\n`
      // check for ready signal
      if (data.includes(readyOutput)) {
        resolve({
          output,
          kill: () => killProcessTree(subprocess, { logger }),
          attach: () => attachProcess(subprocess),
          detach: () => detachProcess(subprocess),
        })
      }
    })
  })

  return withTimeout(
    request,
    timeout,
    new Error(`Starting the process timed out:\n${output}`)
  )
}
