# Specification for the next versions of aragonCLI

## Overview

The CLI should package several "core" extensions.
The API these extensions expose is aimed at `node` environments.
The aim is to provide convenience to power-users & devs.

### User apps

@aragon/dao (alias: `org`, `organization`)
├─ `aragon dao new [template] [aragon-id]` ( `await execa('aragon-app', ['exec', '...params']`)
├─ `aragon dao apps [dao]`
├─ `aragon dao install [dao] [app]` 
├─ `aragon dao initialize [dao] [app]` 🔬
└─ `aragon dao upgrade [dao] [app]`
@aragon/app
├─ `aragon app read [app] [fn] [fn-args]` 🔬
└─ `aragon app exec [app] [fn] [fn-args] [--with-agent]` 🔬
@aragon/id
├─ `aragon id transfer [dao] [aragon-id]` 🔬
├─ `aragon id unassign [dao] [aragon-id]` 🔬
└─ `aragon id assign [dao] [aragon-id]`
@aragon/acl (alias: `permissions`)
├─ `aragon acl view [dao]`
├─ `aragon acl create [dao] [app] [role] [entity] [manager]`
├─ `aragon acl set-manager [dao] [app]`
└─ `aragon acl remove-manager`
@aragon/token
├─ `aragon token new`
└─ `aragon token change-controller`
@aragon/apm (alias: `packages`, `pm`)
├─ `aragon apm list-packages [registry]`
├─ `aragon apm list-versions [repo]`
├─ `aragon apm get-version [repo]`
├─ `aragon apm download [repo]` 🔬 
├─ `aragon apm publish [repo]` 🔬
├─ `aragon apm grant-access [repo] [grantees...]` 
└─ `aragon apm revoke-access [repo] [grantees...]`

@aragon/tx
├─ `aragon tx sign [tx] [--send=true] [--metamask] [--frame] [--priv-key] [--mnemonic]` 🔬
└─ `aragon tx send [tx]` 🔬
> Usecase: Allow the user to sign a raw transaction with various signing providers: MetaMask, Frame, PrivKey, Mnemonic, etc.
> To bridge MetaMask to desktop apps we can use: https://github.com/JoinColony/node-metamask

@aragon/cli-environments (with support for app environments)
├─ `aragon env list` 🔬
└─ `aragon env set-default` 🔬
@aragon/cli-configuration
├─ `aragon config get` 🔬
└─ `aragon config set` 🔬
@aragon/cli-os
├─ `aragon os status` 🔬
└─ `aragon os deploy` 🔬
@aragon/cli-extensions
├─ `aragon ext list` 🔬
├─ `aragon ext install` 🔬
└─ `aragon ext uninstall` 🔬

### Developer apps

@aragon/app-dev
├─ `aragon app-dev init` (rename to unbox?) (`npx @aragon/app-dev init`)
├─ `aragon app-dev run` (creates a new dao everytime, do we need this???)
├─ `aragon app-dev develop` (should not create a dao everytime)
└─ `aragon app-dev publish`
@aragon/js-utils
├─ `aragon js lint`
└─ `aragon js compile`
@aragon/solidity-utils
├─ `aragon sol lint`
└─ `aragon sol compile`
@aragon/ipfs-manager
├─ `aragon ipfs start [--configure=true]`
├─ `aragon ipfs configure` 🔬
├─ `aragon ipfs stop`
├─ `aragon ipfs view`
└─ `aragon ipfs propagate`
@aragon/ganache-manager
├─ `aragon ganache start [--configure=true]`
├─ `aragon ganache configure` 🔬
├─ `aragon ganache stop`
└─ `aragon ganache deploy [contract]`

## IPFS `@aragon/ipfs-utils`

Goals:

- Installing & starting a daemon with the right configuration for development as well as production.
- Interacting with local/remote nodes: authentication, configuration, pinning, etc.
- (?) automatically pin anything published to an APM repository

### IPFS commands

- ✔️ `aragon ipfs install` *Download and install the go-ipfs binaries.*
  - ✔️ Option: `local`
    (for people who don't want to "pollute" the global scope)
    - Default: `false`
    - If false, it should install ipfs with `npm install --global` (U-IPFS-1A)
    - If true, it should install ipfs in the project with `npm install --save` (U-IPFS-1B)
  - ✔️ Option: `dist-version`
    (this allows to try out new features or rollback if a new release breaks something)
    - Default: the version recommended by Aragon community
    - It should allow installing an older or newer version of ipfs (U-IPFS-1C)
  - ✔️ Option: `dist-url`
    (in case the official source is terribly slow or offline)
    - Default: the official source
    - It should allow downloading the binaries from a different source (U-IPFS-1D)
  - ✔️ Option: `skip-confirmation`
    (to be able to run in CI/CD and test environments)
    - Default: `false`
    - If false, it should not ask for the confirmation step (U-IPFS-1E)
    - If true, it should print installation details and ask for confirmation before installing (U-IPFS-1D)
- ✔️ `aragon ipfs start` *Start and configure the daemon.*
  - ✔️ Options: `api-port`, `gateway-port`, `swarm-port`
    - Defaults: `5001`, `8080`, `4001`
    - The daemon should be configured to run on these ports before being started
  - Option: `detached`
    - Default: `true`
    - If true, it should:
      - Start the daemon in the background and exit
      - Pipe the output to logs files in `~/.aragon/logs/ipfs-start-[datetime]-[stdout|stderr].log`
    - If false, it should:
      - Start the daemon and wait until the exit signal is received
      - Stop the daemon on exit
      - Pipe the output to the terminal
  - ✔️ Option: `daemon-args`:
    - Default: `['--migrate', '--init', '--enable-namesys-pubsub']`
    - The daemon should be started with these arguments






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
- ✔️ `aragon ipfs view [cid]` - Display metadata about the content, such as size, links, etc.
- ✔️ `aragon ipfs propagate [cid]` - Request the content and its links at several gateways, making the files
more distributed within the network

### IPFS API

Connection:

- ✔️ `ensureConnection`
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

- ✔️ `getMerkleDAG`
- ✔️ `extractCIDsFromMerkleDAG`
- ✔️ `propagateFiles`

Data viz:

- ✔️ `stringifyMerkleDAG`

## Devchain `@aragon/devchain-utils`

- Pre-bundled because (is tiny?)

### Devchain Binaries

- `aragon devchain` - start ganache with our aragen-generated db

### Devchain API

- `ensureConnection`
- `hasAragonDeployments`
- `deployAragon`
- `start` -- should save stdout and stderr in some files to be outputted by `aragon devchain output`

## Web3 `@aragon/web3-utils`

Note: perhaps this is better suited for `aragonAPI`.

### Web3 API

- `getRecommendedGasLimit`

### `aragon-environments`

aragon signer [tx]

aragon ipfs status
aragon ipfs start
aragon ipfs stop

aragon env deploy
aragon env config --edit
aragon env config --get [name]/ --list

aragon app init
aragon app run
aragon app develop
aragon app unbox
aragon app config --edit
aragon app config --get
