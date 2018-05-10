const util = require('util')
const { spawn, exec } = require('child_process')

const runTruffle = (args) => {
  const truffle = spawn('truffle', args)
  truffle.stdout.pipe(process.stdout)
  truffle.stderr.pipe(process.stderr)
  process.stdin.pipe(truffle.stdin)
}

module.exports = { runTruffle }

