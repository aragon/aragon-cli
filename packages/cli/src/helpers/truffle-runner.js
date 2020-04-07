import execa from 'execa'
import devnull from 'dev-null'

export const runTruffle = (args, { stdout, stderr, stdin }) => {
  return new Promise((resolve, reject) => {
    const truffle = execa('truffle', args, { preferLocal: true })
    let errMsg = ''
    truffle.on('exit', (code) => {
      code === 0 ? resolve() : reject(errMsg)
    })
    // errMsg is only used if the process fails
    truffle.stdout.on('data', (err) => {
      errMsg += err
    })
    truffle.stdout.pipe(stdout || process.stdout)
    truffle.stderr.pipe(stderr || process.stderr)
    process.stdin.pipe(stdin || truffle.stdin)
  })
}

export const compileContracts = async () => {
  await runTruffle(['compile'], { stdout: devnull() })
}
