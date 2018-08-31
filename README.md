# Aragon CLI

[![Build Status](https://img.shields.io/travis/aragon/aragon-dev-cli/master.svg?style=flat-square)](https://travis-ci.org/aragon/aragon-dev-cli)
[![Test Coverage](https://img.shields.io/coveralls/aragon/aragon-dev-cli.svg?style=flat-square)](https://coveralls.io/github/aragon/aragon-dev-cli)
[![NPM version](https://img.shields.io/npm/v/@aragon/cli.svg?style=flat-square)](https://npmjs.org/package/@aragon/cli)
[![Downloads](https://img.shields.io/npm/dm/@aragon/cli.svg?style=flat-square)](https://npmjs.org/package/@aragon/cli)

Aragon CLI is a tool for creating, testing and publishing [Aragon 
applications](https://hack.aragon.org).

## Installation

Install Aragon CLI by running

```bash
npm install -g @aragon/cli
```

## Configuration

Aragon CLI uses Truffle configuration files for the web3 provider. Running any command with `--network x` will tell the CLI to use the configuration for the network `x` in the truffle config. If no network is passed, it will default to the `development` network.

All other configuration must be done through CLI flags for now. Do `aragon [command] --help` for more information about the configuration options for each command.

## Usage

### Apps

#### `aragon init`

```
$ aragon init <APP_NAME> [TEMPLATE]
```

Creates a new directory pre-populated with files from a template. `APP_NAME` must be a full ENS name, such as `foo.aragonpm.eth`, where the top-level name is an APM registry.

`TEMPLATE` defaults to [`react`](https://github.com/aragon/aragon-react-boilerplate), but it can be any valid name of a GitHub repository in the format of `<AUTHOR>/<REPOSITORY>`.

Finally, templates with a single short name (such as `react` or `bare`) are treated as official Aragon templates. These can always be found at `https://github.com/aragon/aragon-<TEMPLATE>-boilerplate`.

#### `aragon run`

```
$ aragon run [--port PORT]
```

For running from a custom Kit (so you can deploy other Aragon apps to the DAO) check https://github.com/aragon/aragon-react-kit-boilerplate

Run the app in the current directory locally.

This command does the following:

- Starts a local chain
- Starts IPFS
- Deploys all of the base smart contracts needed for aragonOS to work (ENS, APM, DAO templates, ...)
- Creates a DAO
- Runs the build script of the app (if specified in `package.json`)
- Publishes the app locally
- Installs it on your freshly created local DAO
- Starts the wrapper and opens up your DAO in your browser

The local chain is started at `PORT`, which defaults to 8545.

The publish step of the app works exactly as `aragon apm publish`, described below.

#### `aragon apm publish`

```
$ aragon apm publish [CONTRACT_ADDRESS or CONTRACT_NAME] [--files PATTERN] [--ignore PATTERN] [--skip-confirm] [--only-artifacts]
```

Publishes a new (or the first!) version of your app.

If the APM repository does not exist at your app's full name, then we try to create a new repository for you at the APM registry from the app name. This usually happens the first time you publish, unless you create your repository manually beforehand.

The files specified by `--files` (defaults to `.`, i.e. all files in the current directory) will be published to IPFS for publishing. Specify `--files` multiple times to include multiple files or directories.

All files in your `.gitignore` (if any) will be ignored, along with all gitignore-like patterns specified by `--ignore` (which can be specified multiple times for multiple patterns).

Before publishing, your smart contract source code is scanned to generate an artifact containing additional metadata about it, such as the different methods of your contract, their Radspec descriptions (if any) and what roles they are guarded by. Specify `--only-artifacts` if you only want this artifact.

If `--skip-confirm` is specified the command will not wait for the transaction to receive confirmations.

#### `aragon apm version`

```
$ aragon apm version <BUMP>
```

Bumps the version of your Aragon app, where a valid `BUMP` is either *major*, *minor* or *patch*.

Note that you are only allowed to release a version with a new smart contract address if the bump specified is major.

#### `aragon apm versions`

```
$ aragon apm versions
```

View a list of published versions for the app in the current directory.

### DAOs

#### `aragon apm grant`

```
$ aragon apm grant <ADDRESS> [--skip-confirm]
```

Grants permission for `ADDRESS` to interact with the APM repository of the app in the current directory.

If `--skip-confirm` is specified the command will not wait for the transaction to receive confirmations.

#### `aragon dao apps` or `dao apps`

```
$ dao apps <your-dao-address>
```

Shows your installed apps along with their Proxy and IPFS addresses.

#### `aragon dao acl` or `dao acl`

```
$ dao acl <your-dao-address>
```

Shows the roles defined in your DAO with all the relevant info: where they are defined and to whom are granted.

### Misc

#### `aragon devchain`

Starts a local ganache test chain for development. This is done automatically with `aragon run` also if you don't have one already running.
