const execa = require('execa')

// execa('npx', ['ganache-cli'], {
execa('npx', ['@aragon/aragen@5.4.1', 'start'], {
  stdout: process.stdout
})
  .catch(() => 'Cannot set up the devchain')
