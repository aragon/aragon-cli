import stripAnsi from 'strip-ansi'
import { init } from '../src/cli'

/**
 * Parses a CLI command and returns its output.
 * Must be used with the '--debug' argument.
 *
 * @param {string[]} args Command arguments
 */
async function main(args) {
  return new Promise((resolve, reject) => {
    let output = ''
    const cli = init(err => {
      console.log = log

      if (err) return reject(err)

      resolve(stripAnsi(output))
    })

    const log = console.log
    console.log = (...str) => (output = `${output}${str.join(' ')}\n`)
    cli.parse(args, err => {
      if (err) return reject(err)
    })
  })
}

export default main
