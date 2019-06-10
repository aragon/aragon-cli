# Roadmap

# Legend

🚧 In progress

✔️ Implemented

⛰ Goals

🔬 Research

# Short-term

🚧 Improve communication of releases

🚧 Review bugfixes

🚧 Keep improving new contributors workflow with feedback got form [forum post](https://forum.aragon.org/t/experimenting-with-bounties-using-the-projects-app/1016/6):
- Install Dot Voting app to [meshteam dao](https://rinkeby.aragon.org/#/meshteam/0x2b2290c2370cbc59e7c77bd36072f801d5e996c8)
- Curate issue to be funded
- Write on-boarding documentation to include in Contribution.md

🚧 Identifying the common building blocks that are reused throughout the CLI commands ( `aclExecHandler.js`, `execHandler.js`, `aragonjs-wrapper.js`, `ipfs.js`, etc.) These should be heavily tested, documented and their relationships simplified as much as possible or at least documented (as they can run very deep, e.g.: `acl grant -> aclExecHandler -> execHandler -> initAragonJS`)

## Low-Hanging fruit

🚧 Wrong options provided by [`--help` for subcommands](https://github.com/aragon/aragon-cli/issues/282)

🚧 Review pending issues --> tests as we go:

- dao apps showing undefined instead of latest
- dao acl and install showing "Succesful execute: 'undefined'" (Show tx path with aragonCLI command (decode/describe tx path)?)
- dao install don't display address (App wasn't deployed in transaction.)

🚧 Review new contributions (stale PR)

🚧 Human-readable [stack traces with `sol-trace`](https://github.com/AragonMesh/0x-dev-tools) and replace `solidity-coverage` in the boilerplates

🚧 [Remove hard-coded gas price](https://github.com/aragon/aragon-cli/issues/353) (would be nice to let the user decide how much)

🚧 [Claiming an aragonid](https://github.com/aragon/aragon-cli/issues/347)

🚧 Display better error messages:

- Error codes would be useful
- Create a full list under hack#aragonCLI with all of them, similar to [this](https://docs.microsoft.com/en-us/windows/desktop/debug/system-error-codes)
- Some places it's needed: [here](https://github.com/aragon/aragon-cli/issues/309), [here](https://github.com/aragon/aragon-cli/issues/308) and [here](https://github.com/aragon/aragon-cli/issues/310)

## Documentation

🚧 Squash and rebase

🚧 Guide about propagating content

🚧 Update new features:

- tx pathing in aragon apm publish [#425](https://github.com/aragon/aragon-cli/pull/425)
- aragon apm extract-functions [#423](https://github.com/aragon/aragon-cli/pull/423)
- aragon start [#255](https://github.com/aragon/aragon-cli/pull/255)
- aragon versions iteration

## Commands

🚧 Iterate on `dao act`

- Include optional parameter for ETH value

🚧 Iterate on `aragon apm publish`

- Display information before publish (instead of fetching after publish)
- Sanity check artifacts
- Add deprecated methods to artifact
- Been able to publish minor or patch versions if only @notice are changed on smart contracts

🚧 Iterate on ipfs commands

- Should the files from `ipfs-cache` be added to the "remote" node (`apmOptions.ipfs.rpc`)? What happens if that fails? Should it first check if the files are there and if not throw an error/warning?

Currently the CLI will try to connect to `[localhost:5001](http://localhost:5001)` even if `apmOptions.ipfs.rpc` is provided and has CORS configured, see [here](https://github.com/aragon/aragon-cli/blob/master/src/commands/ipfs.js#L47)

- What is the rationale for `ignore: 'node_modules'`? Could this be instead done when generating the `ipfs-cache`?

🚧 Iterate on `aragon start` -> `run-aragon-app`

- Intended to be more development friendly that `aragon run`, i.e. [doesn't create a new dao every time](https://github.com/aragon/aragon-cli/issues/311), uses http rather than ipfs (to have hot/live reload for the frontends, and maybe something similar for the contracts, a watch → compile loop)

# Past achivements

✔️ [Implement a mono repo structure with `lerna`](https://github.com/aragon/aragon-cli/pull/325)

✔️ [E2E tests](https://github.com/aragon/aragon-cli/tree/master/packages/e2e-tests)

✔️ Experiment with bounties to reward new contributors: [rinkeby dao](https://rinkeby.aragon.org/#/meshteam/0x2b2290c2370cbc59e7c77bd36072f801d5e996c8) and [forum post](https://forum.aragon.org/t/experimenting-with-bounties-using-the-projects-app/1016/6)

## New commands

✔️ `npx create-aragon-appp`

✔️ `aragon ipfs propagate`

✔️ `aragon ipfs view`

✔️ `aragon start`

✔️ `dao act` (thanks to Jorge)

## Improve development workflow

### Linting and code style

✔️ Use `ESLint`, `prettier` and `standard`

✔️ Contributing guide & Pull Request practices

✔️ Issue templates

### Testing

✔️ Unit testing with `ava`

✔️ Tests should ran on push with `husky`

✔️ Code coverage with `coveralls`

### CI & CD

✔️ Continuous deployment to NPM using GitHub actions

✔️ Travis CI

✔️ Greenkeper

### Internal documentation

✔️ Specification

✔️ Dependencies

✔️ Testing

✔️ CI, Review, Labels

## Socoped issues fixed (collapsable option ??)

## aragen maintenance

✔️ Update dependencies

✔️ Survey kit

✔️ Agent app

## Restructure documentation on hack.aragon

✔️ Pull script for aragonCLI docs

✔️ Frame Guide

✔️ Publish Guide

# Long-term

⛰ Mantain Aragon desktop

⛰ Analytics to see useful metrics (e.g. more used commands)

⛰ Use IPFS global install

## New features

⛰ CLI extensions: [issue](https://github.com/aragon/aragon-cli/issues/416), and [forum post](https://forum.aragon.org/t/aragoncli-extensibility/680)

⛰ Have a flag for `dao act` to pass an address to agent to communicate between dao instances. Two daos communicate between them using the agent app and execute commands on each other.

⛰ Change to use XGB instead of /.aragon ([issue](https://github.com/aragon/aragon-cli/issues/355))

⛰ Improve acl commands

- Allow create permissions with parameters
- Show permission parameters output

⛰ New aragonCLI config parameters (ipfs, rpc, gass-limit, etc)

- Get gas consumed on each command

## Development workflow

⛰ Human-readable stack traces with `sol-trace` for aragonCLI

⛰ Types (use Flow or Typescript) because it will allow us to catch more "errors" at compile time, having commands silently fail without noticing (like [this](https://github.com/aragon/aragon-cli/pull/334#discussion_r248659171)) less often. Using Typescript is also great for intellisense support (having auto-completion from IDEs) and refactoring

⛰ Update truffle to v5

## aragen

⛰ Move to aragonCLI monorepo as a new pacakge

⛰ Identify contracts like the `MiniMeTokenFactory` which do not need to be deployed every time, but rather reused, and publish them to `aragonpm.eth` (just like the `dao-kits`, we will hardcode an address in aragen like we do with the root ENS)

## Specification for the next versions of aragonCLI

The CLI should package several "core" extensions.
The API these extensions expose is aimed at `node` environments.
The aim is to provide convenience to power-users & devs.

### Overview

```sh
@aragon/dao-cli
├── @aragon/dao (binary: `aragon-dao`, commands: `new`, `apps`, `install`, `upgrade`, `exec`, `act`)
├── @aragon/token (binary: `aragon-token`, commands: `new`, `change-controller`)
├── @aragon/acl (binary: `aragon-acl`, commands: `view`, `create`, `grant`, `revoke`, `set-manager`, `remove-manager`)

@aragon/dev-cli
├── create-aragon-app
├── run-aragon-app
├── develop-aragon-app
├── @aragon/ipfs-utils (binary: `aragon-ipfs`, commands: `start`, `stop`, `view`, `propagate`)
├── @aragon/ganache-utils (binary: `aragon-devchain`, commands: `start`, `stop`, `deploy`)
├── @aragon/apm (binary: `aragon-apm`, commands: `versions`, `packages`, `info`, `grant`, `publish`)
```

### IPFS `@aragon/ipfs-utils`

Goals:

- installing & starting a daemon with the right configuration
- interacting with local/remote nodes: authentication, configuration, pinning, etc.
- help setup a "production" node (?)
- automatically pin anything published to an AragonPM repository (?)

#### IPFS Binaries

Local node:

✔️ `aragon ipfs` - Alias for `aragon ipfs start`

- `aragon ipfs start` - Start the **IPFS Daemon**

  - Should start in the background and then finish
  - Should start with the recommended configuration from `$HOMEDIR/.aragon/ipfsconfig.json`. E.g.:

  ```json
  {
    "daemonArgs": ["--migrate", "--enable-namesys-pubsub"],
    "logsLocation": "$HOMEDIR/.aragon/ipfs-logs"
  }
  ```

  - Should save `stdout` and `stderr` to files, e.g.: `stdout-${number}.log` in the `logsLocation`
  - Should warn if it's already running
  - Should error (exit code 1) if it cannot start (missing libs/ports taken)
  - Should inform about where the logs are saved and how to stop it
  - Should run `aragon ipfs status` and finish afterwards (optional)

- `aragon ipfs stop` - Stop the **IPFS Daemon**
  - Should warn if the node was already stopped
- `aragon ipfs enable-startup` - Start the **IPFS Daemon** automatically at start-up

Local/remote node:

- `aragon ipfs status` - Check the configuration of the **IPFS Daemon**
  - Should print if CORS is enabled
  - Should print which Aragon artifacts are pinned
  - Should print number of peers, repository size
  - Should print which ports are used
  - Should print local ip and public ip
  - Should print bootstrapped nodes
  - If it's a local node:
    - Should print whether 'Run at startup' is enabled
  - If it's not configured correctly:
    - Should ask whether to run `aragon ipfs configure`
    - or Should error (exit code 1)
- `aragon ipfs configure` - Configure the **IPFS Daemon**
  - Should configure CORS
  - Should pin Aragon artifacts (from ipfs with a fallback to http)
  - Should inform the user about advanced configurations with `ipfs config`
    ✔️ `aragon ipfs view <cid>` - Display metadata about the content, such as size, links, etc.
    
    ✔️ `aragon ipfs propagate <cid>` - Request the content and its links at several gateways, making the files more distributed within the network

#### IPFS API

Connection:

✔️ `ensureConnection`

- throws if it cannot be established
- 🚧 auth headers support
- `start`

Installation:

- `isInstalled`
- `install`

Configuration:

- `hasCORSEnabled`
- `enableCORS`
- `hasAragonArtifacts`
- `listAragonArtifacts`
- `pinAragonArtifacts`
- `hasAuthEnabled`
- `enableAuth`

Data:

✔️ `getMerkleDAG`

✔️ `extractCIDsFromMerkleDAG`

✔️ `propagateFiles`

Data viz:

✔️ `stringifyMerkleDAG`

### Devchain `@aragon/devchain-utils`

- Pre-bundled because (is tiny?)

#### Devchain Binaries

- `aragon devchain` - start ganache with our aragen-generated db

#### Devchain API

- `ensureConnection`
- `hasAragonDeployements`
- `deployAragon`
- `start` -- should save stdout and stderr in some files to be outputed by `aragon devchain output`

### Web3 `@aragon/web3-utils`

Note: perhaps this is better suited for `aragonAPI`.

#### Web3 API

- `getRecommendedGasLimit`

## Research

🔬 Support interactive experince with aragonCLI

- The goal of this tool will be to help new users create a custom DAO
- "Import" the onboarding of the multisig and democracy kits from the ui client
- Improve UX for installing "core" apps (e.g.: TokenManager, Voting, etc.), because currently is a bit tricky as you have to check what arguments the `initialize` function takes from the app's contract and pass them with `--app-init-args`, e.g.: `dao install [dao-address] voting --app-init-args 0x00000001 600000000000000000 250000000000000000 604800`. We should do this, instead of the users, so they can see what are the needed parameters with `--help` or `--interactive`. For example `dao install voting --help` could return `dao install voting [dao-address] [token-address] [support-required] [quorum] [vote-time]`
- Commands can become interactive (with prompts) using `[yargs-interactive](https://www.npmjs.com/package/yargs-interactive)`

Example: To create a new MiniMe token, you would use the `dao token new` command, which takes the following arguments `<token-name> <symbol> [decimal-units] [transfer-enabled]`, e.g.: `dao token new "Aragon Network Token" "ANT" 18 true`. Using `dao token new --interactive`

Note: We should be able to do get the initialize function's params from the artifact.json if it's published onto an aragonPM instance.
