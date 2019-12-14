const execa = require('execa')
const devnull = require('dev-null')
//
const { getBinary, getPackageRoot } = require('@aragon/toolkit/dist/node')

const truffleBin = getBinary('truffle', getPackageRoot(__dirname))

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
  await runTruffle(['compile'], { stdout: devnull() })
}

module.exports = { runTruffle, compileContracts }
