import execa from 'execa'

/**
 * execa wrapper
 * Pipes stdout and stderr to the parent process
 */
export function execaPipe(
  file: string,
  args?: readonly string[],
  options?: execa.Options
): execa.ExecaChildProcess {
  const subprocess: execa.ExecaChildProcess = execa(file, args, options)

  if (subprocess.stdout) {
    subprocess.stdout.pipe(process.stdout)
  }
  if (subprocess.stderr) {
    subprocess.stderr.pipe(process.stderr)
  }

  return subprocess
}

/**
 * execa wrapper
 * Calls a logger on all stdout and stderr data events
 */
export function execaLogTo(logger: (data: string) => void) {
  return (
    file: string,
    args: readonly string[],
    options?: execa.Options
  ): execa.ExecaChildProcess => {
    const subprocess: execa.ExecaChildProcess = execa(file, args, options)

    function dataCallback(bytes: any): void {
      const data = Buffer.from(bytes, 'utf-8').toString()
      logger(data)
    }

    if (subprocess.stdout) {
      subprocess.stdout.on('data', dataCallback)
    }
    if (subprocess.stderr) {
      subprocess.stderr.on('data', dataCallback)
    }

    return subprocess
  }
}
