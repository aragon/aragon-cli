# Specification

## Web3 API

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

See [`src/util.js#getRecommendedGasLimit`](https://github.com/aragon/aragon-cli/blob/master/packages/aragon-cli/src/util.js#L118).
(This should probably be its own library since `aragon.js` uses it as well)

Note: The CLI should ignore the `gas` property of the network from truffle config.

## Node/npm API

- `getLocalBinary`
  
This packages relies on dependencies like `go-ipfs`, `truffle` and `ganache-cli` that expose one
or more binaries.

Before calling them in our code we need a way to figure out their location.

When doing `npm install @aragon/cli`, `npm` will hoist dependencies like this:

```md
node_modules
├── @aragon/cli
├── ganache-cli
├── go-ipfs
└── truffle
```

In this case the binaries will be available at `node_modules/.bin`.

When doing `npm install path/to/aragon-cli`, `npm` will create symbolic links instead, making the
dependency tree look like this:

```md
node_modules
└─┬ aragon-cli
  └─┬ node_modules
    ├── ganache-cli
    ├── go-ipfs
    └── truffle
```

In this case the binaries will be available at `node_modules/aragon-cli/node_modules/.bin`.

Having this said, we need an utility to calculate the correct path. This utility should check
whether the binary exists in `project_root` + `./node_modules/.bin`, and if it does not,
it should go up once or twice (if scoped) and look into the `.bin` directory. This can be achieved
using [`__dirname`][dirname-docs].

See [`src/util.js#getLocalBinary`](https://github.com/aragon/aragon-cli/blob/master/packages/aragon-cli/src/util.js#L66).

[dirname-docs]: https://nodejs.org/docs/latest/api/globals.html#globals_dirname
