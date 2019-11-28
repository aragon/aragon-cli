import test from 'ava'
import { extractTruffleArgs, contracts } from '../../src/lib/contracts'
import { Writable } from 'stream'

test('extractTruffleArgs should output the correct arguments', t => {
  t.deepEqual(extractTruffleArgs(['node', 'aragon', 'contracts', 'compile']), [
    'compile',
  ])

  t.deepEqual(extractTruffleArgs(['aragon', 'contracts', 'help', 'compile']), [
    'help',
    'compile',
  ])

  t.deepEqual(
    extractTruffleArgs([
      '/Users/test/.nvm/versions/node/v11.15.0/bin/node',
      'cli.js',
      'contracts',
      'arg1',
      'arg2',
      'arg3',
    ]),
    ['arg1', 'arg2', 'arg3']
  )
})

test('contracts ["version"] displays truffle verion', async t => {
  const stdout = stringStream()
  await contracts(['version'], { stdout })

  t.true(stdout.output.includes('Truffle v'))
})

test('contracts ["help"] displays truffle help', async t => {
  const stdout = stringStream()
  // Truffle outputs the help command in stderr
  await contracts(['help'], { stdout, stderr: stdout })
  t.true(stdout.output.includes('Usage: truffle '))
})

const stringStream = () => {
  const stream = new Writable({
    objectMode: true,
    write: (data, _, done) => {
      stream.output += data.toString()
      done()
    },
  })
  stream.output = ''

  return stream
}
