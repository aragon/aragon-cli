const killProcessOnPort = require('kill-port')

killProcessOnPort('8545')
  .then(() => 'Process killed on 8545')
  .catch(() => 'Cannot kill the process on 8545')
