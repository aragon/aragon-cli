const execa = require('execa')

const runTruffle = async (args, { stdout, stderr, stdin }) => {
  return new Promise((resolve, reject) => {
    const truffle = execa('truffle', args)
    truffle.stdout.pipe(stdout || process.stdout)
    truffle.stderr.pipe(stderr || process.stderr)
    process.stdin.pipe(stdin || truffle.stdin)
    truffle.on('close', resolve)
  })
}

const compileContracts = async () => {
  await runTruffle(['compile'])
}

module.exports = { runTruffle, compileContracts }