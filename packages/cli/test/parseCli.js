import stripAnsi from 'strip-ansi'
import { init } from '../src/cli'

/**
 * Parses a CLI command and returns its output.
 * Must be used with the '--debug' argument.
 *
 * @param {string[]} args Command arguments
 * @param {number} timeout Command timeout time in ms
 */
async function parseCli(args, timeout) {
  return new Promise((resolve, reject) => {
    let output = ''
    let completed = false

    const onComplete = err => {
      if (!completed) {
        console.log = log
        completed = true

        if (err) return reject(err)

        resolve(stripAnsi(output))
      }
    }
    const cli = init(onComplete)

    const log = console.log
    console.log = (...str) => (output = `${output}${str.join(' ')}\n`)
    cli.parse(args, err => {
      if (err) return reject(err)
    })

    if (timeout) setTimeout(onComplete, timeout)
  })
}

export default parseCli
