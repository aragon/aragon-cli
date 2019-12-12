import execa from 'execa'
import psTree from 'ps-tree'

// let's try gracefully, otherwise we can do SIGTERM or SIGKILL
const defaultKillSignal = 'SIGINT'
const defaultLogger = process.env.DEBUG ? console.log : () => {}

/**
 *
 * Run a command using the freshly compiled aragonCLI build from the "dist" folder.
 *
 * @param {Array<string>} args the arguments to call the CLI with, e.g.: ['dao', 'new']
 * @return {Promise<string>} stdout
 */
export const runCreateAragonApp = async (args, verbose = false) => {
  const subprocess = execa('node', ['dist/cli.js', ...args])
  if (verbose) {
    console.log(`\n>>> ${args.join(' ')}`)
    subprocess.stdout.pipe(process.stdout)
  }
  return subprocess
}

export async function startBackgroundProcess({
  cmd,
  args,
  execaOpts,
  readyOutput,
  logger = defaultLogger,
  killSignal = defaultKillSignal,
}) {
  return new Promise((resolve, reject) => {
    // start the process
    const subprocess = execa(cmd, args, execaOpts)

    let stdout = ''
    let stderr = ''
    let logPrefix
    if (args && args.length > 0) {
      logPrefix = `${cmd} ${args[0]}`
    } else {
      logPrefix = cmd
    }

    logger(logPrefix, 'spawned with PID: ', subprocess.pid)

    // return this function so the process can be killed
    const exit = () =>
      new Promise((resolve, reject) => {
        psTree(subprocess.pid, (err, children) => {
          if (err) reject(err)

          children.map(child => {
            // each child has the properties: COMMAND, PPID, PID, STAT
            logger(logPrefix, 'killing child: ', child)
            process.kill(child.PID, killSignal)
          })

          resolve()
        })
      })

    subprocess.stdout.on('data', data => {
      // parse
      data = data.toString()
      // log
      logger(logPrefix, 'stdout:', data)
      // build output stream
      stdout += data
      // check for ready signal
      if (data.includes(readyOutput)) {
        resolve({
          exit,
          stdout,
        })
      }
    })

    subprocess.stderr.on('data', data => {
      // parse
      data = data.toString()
      // log
      logger(logPrefix, 'stderr:', data)
      // build error stream
      stderr += data
    })

    subprocess.on('close', (code, signal) => {
      // log
      logger(logPrefix, 'closing with code:', code, 'and signal:', signal)

      // reject only if the promise did not previously resolve
      // which means this is probably getting killed by the test which is ok
      if (!stdout.includes(readyOutput)) {
        const err = new Error(
          `Process closed unexpectedly with code ${code} and signal ${signal}`
        )
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
      }
    })

    subprocess.on('exit', (code, signal) => {
      logger(logPrefix, 'exiting with code:', code, 'and signal:', signal)
    })
  })
}

/**
 * Some characters are rendered differently depending on the OS.
 *
 * @param {string} stdout
 */
export function normalizeOutput(stdout) {
  const next = stdout
    .replace(/❯/g, '>')
    .replace(/ℹ/g, 'i')
    // TODO: remove after https://github.com/aragon/aragon-cli/issues/367 is fixed
    .replace(/cli.js/g, 'aragon')
    // sometimes there's an extra LF
    .trim()

  return next
}
