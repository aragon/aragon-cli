#!/usr/bin/env node
const meow = require('meow')
const handle = require('../src/handle')

const cli = meow(`
  Usage
    $ aragon-dev-cli <subcommand>
  
  Commands
    init <name> [template]        Initialize a new Aragon module from a template (default template: react)
    version <major|minor|patch>   Bump the module version
    versions                      List the published versions of this module
    publish                       Publish a new version of the module
    playground                    Inject module into local Aragon application    
  
  Options
    --key <privkey>               The Ethereum private key to sign transactions with. Raw transaction will be dumped to stdout if no key is provided.  
    --registry <registry>         The repository registry to use for creating and publishing packages (default: aragonpm.eth)
    --rpc                         A URI to the Ethereum node used for RPC calls (default: https://ropsten.infura.io)
    --chain-id                    The ID of the chain to interact with (default: 3)

  Examples
    $ aragon-dev-cli version major
    New version is 2.0.0

    $ aragon-dev-cli init poll --registry=module-corp.eth
    Created new module poll.module-corp.eth

    $ aragon-dev-cli init cool-app
    Created new module cool-app.aragonpm.eth
`, {
  default: {
    registry: 'aragonpm.eth',
    rpc: 'https://ropsten.infura.io',
    chainId: 3
  },
  string: ['key', 'rpc', 'registry']
})

handle(cli)
