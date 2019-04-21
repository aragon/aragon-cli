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

See `src/util.js#getRecommendedGasLimit`.
(This should probably be its own library since `aragon.js` uses it as well)

Note: The CLI should ignore the `gas` property of the network from truffle config.
