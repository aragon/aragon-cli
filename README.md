# Aragon CLI

CLI tool for creating, testing and publishing Aragon modules.

## Installation

```bash
npm install -g @aragon/cli
```

## Usage

```
➜ aragon-example-module aragon-dev-cli --help

  Aragon command-line tools

  Usage
    $ aragon-dev-cli <subcommand>

  Commands
    init <name>                   Initialize a new Aragon module
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
```

## Recipes

### Creating and publishing a module

```bash
mkdir polls-app
cd polls-app
aragon-dev-cli init polls
aragon-dev-cli publish
```

### Publishing a new version

```bash
aragon-dev-cli version minor
aragon-dev-cli publish
```
