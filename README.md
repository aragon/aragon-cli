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
➜ aragon-example-application aragon-dev-cli help
aragon-dev-cli <command>

Commands:
  aragon-dev-cli bootstrap               Set up a development chain and deploy
                                         an Aragon organization
  aragon-dev-cli init <name> [template]  Initialise a new application
  aragon-dev-cli playground              Set up a dev chain, deploy an Aragon
                                         organization and install your app
  aragon-dev-cli publish [contract]      Publish a new version of the
                                         application
  aragon-dev-cli version <bump>          Bump the application version
  aragon-dev-cli versions                List all versions of the package

APM:
  --apm.ens-registry  Address of the ENS registry
  --eth-rpc           An URI to the Ethereum node used for RPC calls
                                              [default: "http://localhost:8545"]

APM providers:
  --apm.ipfs.rpc  An URI to the IPFS node used to publish files
                   [default: {"host":"localhost","protocol":"http","port":5001}]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --silent   Silence output to terminal                         [default: false]

For more information, check out https://wiki.aragon.one
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

```bash
aragon-dev-cli init polls.aragonpm.test username/gh-repo
```
