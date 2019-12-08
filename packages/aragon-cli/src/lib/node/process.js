import execa from 'execa'
import killProcessOnPort from 'kill-port'
//
import { withTimeout } from './misc'

export { killProcessOnPort }

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
}) => {
  let output = ''

  const request = new Promise((resolve, reject) => {
    // start the process
    const subprocess = execa(cmd, args, execaOpts)

    subprocess.stderr.on('data', data => {
      data = data.toString()
      reject(new Error(data))
    })

    subprocess.stdout.on('data', data => {
      data = data.toString()
      // build the output log (to be able to err out if the time is up)
      output = `${output}${data}\n`
      // check for ready signal
      if (data.includes(readyOutput)) {
        resolve({
          output,
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
