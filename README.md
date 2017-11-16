# Aragon CLI

CLI tool for creating, testing and publishing Aragon applications.

## Installation

```bash
npm install -g @aragon/cli
```

## Usage

```
➜ aragon-example-application aragon-dev-cli --help

  Usage
    $ aragon-dev-cli <subcommand>

  Commands
    init <name>                   Initialize a new Aragon application (e.g. test.aragonpm.eth)
    version <major|minor|patch>   Bump the application version
    versions                      List the published versions of this application
    publish                       Publish a new version of the application
    playground                    Inject application into local Aragon client

  Options
    --key <privkey>               The Ethereum private key to sign transactions with. Raw transaction will be dumped to stdout if no key is provided.
    --rpc                         A URI to the Ethereum node used for RPC calls (default: https://ropsten.infura.io)
    --chain-id                    The ID of the chain to interact with (default: 3)
    --ens-registry                Address for the ENS registry (default: canonical ENS for chainId)

  Examples
    $ aragon-dev-cli version major
    New version is 2.0.0

    $ aragon-dev-cli init cool-app.aragonpm.eth
    Created new application cool-app.aragonpm.eth
```

## Recipes

### Creating and publishing an application

```bash
aragon-dev-cli init polls.aragonpm.test
cd polls
aragon-dev-cli publish
```

### Publishing a new version

```bash
aragon-dev-cli version minor
aragon-dev-cli publish
```

### Scaffolding from a custom template
```
aragon-dev-cli init polls.aragonpm.test username/gh-repo
```
