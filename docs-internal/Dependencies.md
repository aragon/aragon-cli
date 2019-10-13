# Dependencies

## Dependabot

We have setup [dependabot][dependabot-home] to take care of updating dependencies to their latest
versions.

## Lock files

We are using [npm shrinkwrap][shrinkwrap-home] for the reasons described [here][shrinkwrap-issue].

### Regenerate the lockfiles

Example:

```sh
npm run delete-shrinkwraps
npm run clean
npm install # this will call bootstrap too
npm run create-shrinkwraps
```

## Out of date dependencies

To check outdated dependencies:

```sh
npm outdated
```

### truffle

We cannot use `truffle@v5` nor `truffle@v4.1.15`, because the `aragonOS` contracts need to be
compiled with `solidity@v0.4.24`.

- Version `5.x.x` is bundling `solidity@v0.5`.
- Version `4.1.15` is bundling `solidity@v0.4.25`.

A better solution is to upgrade to `v5` and allow compilers configs: <https://github.com/aragon/aragon-cli/issues/498>

### ignore

Version 5 breaks our tool: [travis-log][ignore-fail-log]

Migration guide: [4x to 5x][ignore-migration-guide]

## Tips

- To pin a dependency:

```sh
npm install --save-exact web3@1.0.0-beta.34
```

- To downgrade a dependency:

```sh
npm install --save ignore@4
```

- To upgrade a dependency:

```sh
npm install --save ignore@latest
```

Note: sometimes you need to [regenerate the lockfiles](#regenerate-the-lockfiles) when you install
a new package, because the automatic updates prove very unreliable.

[dependabot-home]: https://dependabot.com/
[shrinkwrap-home]: https://docs.npmjs.com/cli/shrinkwrap.html
[shrinkwrap-issue]: https://github.com/aragon/aragon-cli/issues/477
[ignore-fail-log]: https://travis-ci.org/aragon/aragon-cli/jobs/536290327#L945
[ignore-migration-guide]: https://travis-ci.org/aragon/aragon-cli/jobs/536290327#L945
