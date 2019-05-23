import execa from 'execa'
import psTree from 'ps-tree'

// let's try gracefully, otherwise we can do SIGTERM or SIGKILL
const defaultKillSignal = 'SIGINT'
const defaultLogger = process.env.DEBUG ? console.log : () => { }

export async function startBackgroundProcess ({
  cmd,
  args,
  execaOpts,
  readyOutput,
  logger = defaultLogger,
  killSignal = defaultKillSignal
}) {
  return new Promise((resolve, reject) => {
    // start the process
    const subprocess = execa(cmd, args, execaOpts)
    logger(cmd, 'spawned with PID: ', subprocess.pid)
    let stdout = ''
    let stderr = ''

    // return this function so the process can be killed
    const exit = () => new Promise((resolve, reject) => {
      psTree(subprocess.pid, (err, children) => {
        if (err) reject(err)

        children.map(child => { // each child has the properties: COMMAND, PPID, PID, STAT
          logger(cmd, 'killing child: ', child)
          process.kill(child.PID, killSignal)
        })

        resolve()
      })
    })

    subprocess.stdout.on('data', data => {
      // parse
      data = data.toString()
      // log
      logger(cmd, 'stdout:', data)
      // build output stream
      stdout += data
      // check for ready signal
      if (data.includes(readyOutput)) {
        resolve({
          exit,
          stdout
        })
      }
    })

    subprocess.stderr.on('data', data => {
      // parse
      data = data.toString()
      // log
      logger(cmd, 'stderr:', data)
      // build error stream
      stderr += data
    })

    subprocess.on('close', (code, signal) => {
      // log
      logger(cmd, 'closing with code:', code, 'and signal:', signal)

      // reject only if the promise did not previously resolve 
      // which means this is probably getting killed by the test which is ok
      if (!stdout.includes(readyOutput)) {
        const err = new Error(`Process closed unexpectedly with code ${code} and signal ${signal}`)
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
      }
    })

    subprocess.on('exit', (code, signal) => {
      logger(cmd, 'exiting with code:', code, 'and signal:', signal)
    })
  })
}

/**
 * Some characters are rendered differently depending on the OS.
 * 
 * @param {string} stdout 
 */
export function normalizeOutput (stdout) {
  const next = stdout
    .replace(/❯/g, '>')
    .replace(/ℹ/g, 'i')
    // TODO: remove after https://github.com/aragon/aragon-cli/issues/367 is fixed 
    .replace(/cli.js/g, 'aragon')
    // sometimes there's an extra LF
    .trim()

  return next
}
