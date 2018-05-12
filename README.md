# Aragon CLI

[![Build Status](https://img.shields.io/travis/aragon/aragon-dev-cli/master.svg?style=flat-square)](https://travis-ci.org/aragon/aragon-dev-cli)
[![Test Coverage](https://img.shields.io/coveralls/aragon/aragon-dev-cli.svg?style=flat-square)](https://coveralls.io/github/aragon/aragon-dev-cli)
[![NPM version](https://img.shields.io/npm/v/@aragon/cli.svg?style=flat-square)](https://npmjs.org/package/@aragon/cli)
[![Downloads](https://img.shields.io/npm/dm/@aragon/cli.svg?style=flat-square)](https://npmjs.org/package/@aragon/cli)

Aragon CLI is a tool for creating, testing and publishing Aragon applications.

## Installation
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Faragon%2Faragon-dev-cli.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Faragon%2Faragon-dev-cli?ref=badge_shield)


Install Aragon CLI by running

```bash
npm install -g @aragon/cli
```

## Configuration

In order to publish apps you need to create a keyfile in your home directory with the following values:

```js
{
  "key": "<snip>"
  "rpc": "wss://rinkeby.infura.io/ws",
  "ens": "0xfbae32d1cde628bc45f51efc8cc4fa1415447e"
}
```

> Note that the ENS registry address is an Aragon deployment

Please note that you need to replace `<snip>` with private key with **no password**. This is a temporary measure and will be changed in the near future. **Please only use this on testnets for development**.

Save the file as `.localkey.json` in your home directory. You can now publish apps.

To use other networks, you can change the `rpc` and `ens` keys.

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

The publish step of the app works exactly as `aragon publish`, described below.

#### `aragon publish`

```
$ aragon publish [CONTRACT_ADDRESS] [--files PATTERN] [--ignore PATTERN] [--skip-confirm] [--only-artifacts]
```

Publishes a new (or the first!) version of your app.

If the APM repository does not exist at your app's full name, then we try to create a new repository for you at the APM registry from the app name. This usually happens the first time you publish, unless you create your repository manually beforehand.

The files specified by `--files` (defaults to `.`, i.e. all files in the current directory) will be published to IPFS for publishing. Specify `--files` multiple times to include multiple files or directories.

All files in your `.gitignore` (if any) will be ignored, along with all gitignore-like patterns specified by `--ignore` (which can be specified multiple times for multiple patterns).

Before publishing, your smart contract source code is scanned to generate an artifact containing additional metadata about it, such as the different methods of your contract, their Radspec descriptions (if any) and what roles they are guarded by. Specify `--only-artifacts` if you only want this artifact.

If `--skip-confirm` is specified the command will not wait for the transaction to receive confirmations.

#### `aragon version`

```
$ aragon version <BUMP>
```

Bumps the version of your Aragon app, where a valid `BUMP` is either *major*, *minor* or *patch*.

Note that you are only allowed to release a version with a new smart contract address if the bump specified is major.

#### `aragon versions`

```
$ aragon versions
```

View a list of published versions for the app in the current directory.

### DAOs

#### `aragon grant`

**Note: This command is deprecated and will be replaced with a new one in the near future**

```
$ aragon grant <ADDRESS> [--skip-confirm]
```

Grants permission for `ADDRESS` to interact with the APM repository of the app in the current directory.

If `--skip-confirm` is specified the command will not wait for the transaction to receive confirmations.

## Recipes

### Creating and publishing an application

```bash
aragon init polls.aragonpm.test
cd polls
aragon publish
```

### Publishing a new version

```bash
aragon version minor
aragon publish
```

### Scaffolding from a custom template

```bash
aragon init polls.aragonpm.test username/gh-repo
```


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Faragon%2Faragon-dev-cli.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Faragon%2Faragon-dev-cli?ref=badge_large)