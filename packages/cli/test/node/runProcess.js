// The purpose of this script is to simulate an initialization time and a execution time in order
// to test toolkit/node/process.js. The script can also spawn its own childs processes

// usage:
// node runProcess
// node runProcess --errorFlag  => will print some error message to stderr
// node runProcess --childs=10  => current process will spawn 10 childs

const cp = require('child_process') // eslint-disable-line
const argv = require('yargs').argv // eslint-disable-line

// Configuration
const READY_TEXT_OUTPUT = 'process initialized'
const DEFAULT_INIT_TIME = 500
const DEFAULT_EXEC_TIME = 5000

// handle SIGINT signal
process.on('SIGINT', () => process.exit())

// call main function
main()

// main function definition
async function main() {
  process.chdir(__dirname)

  // write on stderr if --errorFlag is set
  if (argv.errorFlag) console.error('Error flag is set!')

  const p = {
    ppid: process.ppid,
    pid: process.pid,
  }

  console.log(p) // this output will be parsed by test

  // spawn other processes
  if (argv.childs) {
    for (let i = 0; i < argv.childs; i++) {
      // spawn child processes
      const subprocess = cp.spawn('node', ['runProcess.js'])
      subprocess.stdout.on('data', stdout => {
        console.log(stdout.toString())
      })
    }
  }

  // simulated initialization time
  await setTimeout(() => console.log(READY_TEXT_OUTPUT), DEFAULT_INIT_TIME)

  // simulated execution time
  await setTimeout(() => console.log('Done...'), DEFAULT_EXEC_TIME)
}
