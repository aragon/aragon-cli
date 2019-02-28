const execa = require('execa')
const devnull = require('dev-null')
const { getNPMBinary } = require('../util')

const truffleBin = getNPMBinary('truffle', 'build/cli.bundled.js')

const runTruffle = (args, { stdout, stderr, stdin }) => {
  return new Promise((resolve, reject) => {
    const truffle = execa(truffleBin, args)
    let errMsg = ''
    truffle.on('exit', code => {
      code === 0 ? resolve() : reject(errMsg)
    })
    // errMsg is only used if the process fails
    truffle.stdout.on('data', err => {
      errMsg += err
    })
    truffle.stdout.pipe(stdout || process.stdout)
    truffle.stderr.pipe(stderr || process.stderr)
    process.stdin.pipe(stdin || truffle.stdin)
  })
}

const compileContracts = async () => {
  try {
    await runTruffle(['compile'], { stdout: devnull() })
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}

module.exports = { runTruffle, compileContracts }
