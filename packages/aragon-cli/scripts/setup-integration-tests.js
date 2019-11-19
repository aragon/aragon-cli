const execa = require('execa')

// execa('npx', ['ganache-cli'], {
execa('npx', ['aragen', 'start'], {
  stdout: process.stdout
})
  .catch(() => 'Cannot set up the devchain')
