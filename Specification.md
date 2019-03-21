# Specification

The CLI should package several "core" extensions.
The API these extensions expose is aimed at `node` environments.
The aim is to provide convenience to power-users & devs.

## IPFS `@aragon/ipfs-utils`

Goals:

- installing & starting a daemon with the right configuration
- interacting with local/remote nodes: authentication, configuration, pinning, etc.
- help setup a "production" node (?)
- automatically pin anything published to an APM repository (?)

### IPFS Binaries

Local node:

- ✔️ `aragon ipfs` - Alias for `aragon ipfs start`
- `aragon ipfs start` - Start the **IPFS Daemon**
  - Should start in the background and then finish
  - Should start with the recommended configuration from `$HOMEDIR/.aragon/ipfsconfig.json`. E.g.:

  ```json
   {
     "daemonArgs": [
       "--migrate",
       "--enable-namesys-pubsub"
     ],
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
- ✔️ `aragon ipfs view <cid>` - Display metadata about the content, such as size, links, etc.
- ✔️ `aragon ipfs propagate <cid>` - Request the content and its links at several gateways, making the files
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
- `hasAragonDeployements`
- `deployAragon`
- `start` -- should save stdout and stderr in some files to be outputed by `aragon devchain output`

## Web3 `@aragon/web3-utils`

Note: perhaps this is better suited for `aragonAPI`.

### Web3 API

- `getRecommendedGasLimit`

By default `web3.js` uses `web3.eth.Contract.method.myMethod().estimateGas()`, but this value can
differ from the actual gas that will be used, if the contract you are calling depends on the
blockhash, blocknumber or any other source of randomness making the gas cost nondeterministic.

E.g.: the [`MiniMeToken`](https://github.com/aragon/aragon-apps/blob/master/shared/minime/contracts/MiniMeToken.sol)
contract which snapshots balances at certain block numbers.

Considering the above-mentioned behavior, the CLI should calculate the recommended gas limit
as follows:

- `recommendedGas = estimatedGas` (if `estimatedGas > upperGasLimit`) or
- `recommendedGas = estimatedGas * DEFAULT_GAS_FUZZ_FACTOR` with a maximum value of `upperGasLimit`

Where:

- `upperGasLimit = latestBlock.gasLimit * LAST_BLOCK_GAS_LIMIT_FACTOR`
- `LAST_BLOCK_GAS_LIMIT_FACTOR = 0.95`
- `DEFAULT_GAS_FUZZ_FACTOR = 1.5`

See `src/util.js#getRecommendedGasLimit`.
(This should probably be its own library since `aragon.js` uses it as well)

Note: The CLI should ignore the `gas` property of the network from truffle config.
