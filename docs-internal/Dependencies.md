# Dependencies

## Greenkeeper

We have setup [greenkeeper][greenkeeper-url] to take care of updating dependencies to their latest
versions.

The configuration file is located at `greenkeeper.json`.

## Out of date dependencies

### Truffle

We cannot use `truffle@v5` nor `truffle@v4.1.15`, because the `aragonOS` contracts need to be
compiled with `solidity@v0.4.24`.

- Version `5.x.x` is bundling `solidity@v0.5`.
- Version `4.1.15` is bundling `solidity@v0.4.25`.

[greenkeeper]: https://greenkeeper.io
