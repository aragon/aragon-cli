<h1 align="center">Aragon CLI</h1>

<div align="center">
  <!-- NPM version -->
  <a href="https://npmjs.org/package/@aragon/cli">
    <img src="https://img.shields.io/npm/v/@aragon/cli.svg?style=flat-square"
      alt="NPM version" />
  </a>
  <!-- Build Status -->
  <a href="https://travis-ci.org/aragon/aragon-dev-cli">
    <img src="https://img.shields.io/travis/aragon/aragon-dev-cli/master.svg?style=flat-square"
      alt="Build Status" />
  </a>
  <!-- Test Coverage -->
  <a href="https://coveralls.io/github/aragon/aragon-dev-cli">
    <img src="https://img.shields.io/coveralls/aragon/aragon-dev-cli.svg?style=flat-square"
      alt="Test Coverage" />
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/@aragon/cli">
    <img src="https://img.shields.io/npm/dm/@aragon/cli.svg?style=flat-square"
      alt="Downloads" />
  </a>
  <!-- Standard -->
  <a href="https://standardjs.com">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square"
      alt="Standard" />
  </a>
</div>

<div align="center">
  <h4>
    <a href="https://aragon.one">
      Website
    </a>
    <span> | </span>
    <a href="https://github.com/aragon/aragon-dev-cli/tree/master/docs">
      Documentation
    </a>
    <span> | </span>
    <a href="https://github.com/aragon/aragon-dev-cli/blob/master/.github/CONTRIBUTING.md">
      Contributing
    </a>
    <span> | </span>
    <a href="https://aragon.chat">
      Chat
    </a>
  </h4>
</div>

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
