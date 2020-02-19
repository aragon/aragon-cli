import test from 'ava'

import parseCli from '../parseCli'


test.serial('devchain start runs the devchain', async t => {
  const stdout = await parseCli(['devchain', '--port', '65500', '--debug'], 20000)

  t.true(stdout.includes('Devchain running at'))
})

test.serial('devchain status returns the correct status', async t => {
  const stdoutRunning = await parseCli(['devchain', 'status', '--debug'])
  const stdoutNotRunning = await parseCli(['devchain', 'status', '--port', '65501', '--debug'])
  
  t.true(stdoutRunning.includes('Devchain running at port'))
  t.true(stdoutNotRunning.includes('Devchain is not running at port'))
})



