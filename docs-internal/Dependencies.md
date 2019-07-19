# Dependencies

## Dependabot

We have setup [dependabot][dependabot-home] to take care of updating dependencies to their latest
versions.

## Cleaning up git modules

Some packages are installed from git and contain a `.git` folder.

For example:

```sh
$ find node_modules/ -name '.git'
node_modules/websocket/.git
node_modules/ganache-core/node_modules/web3-providers-ws/node_modules/websocket/.git
node_modules/ganache-core/node_modules/secp256k1/src/secp256k1-src/.git
node_modules/secp256k1/src/secp256k1-src/.git
```

These are problematic because when trying to link a package `npm link` throws an error:

```sh
npm ERR! path ~/repos/aragon-cli/packages/aragon-cli/node_modules/websocket
npm ERR! code EISGIT
npm ERR! git ~/repos/aragon-cli/packages/aragon-cli/node_modules/websocket: Appears to be a git repo or submodule.
npm ERR! git     ~/repos/aragon-cli/packages/aragon-cli/node_modules/websocket
npm ERR! git Refusing to remove it. Update manually,
npm ERR! git or move it out of the way first.

npm ERR! A complete log of this run can be found in:
npm ERR!     /home/daniel/.npm/_logs/2019-07-18T17_15_26_504Z-debug.log
```

The solution is to run `del-cli './node_modules/**/.git'` on a `postinstall` hook.

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

### @aragon/wrapper

Issue described here: <https://github.com/aragon/aragon.js/issues/325>  
Solution: pin to `5.0.0-rc.9`.

### go-ipfs

The latest version: `0.4.21` is throwing:  
`ERROR    p2pnode: mdns error:  could not determine host IP addresses`  
This error is tracked here: <https://github.com/ipfs/go-ipfs/issues/6359>  
Seems to be fixed, but not released.  

Solution: pin to the only older version published to npm: `0.4.18-hacky2`.

### truffle

We cannot use `truffle@v5` nor `truffle@v4.1.15`, because the `aragonOS` contracts need to be
compiled with `solidity@v0.4.24`.

- Version `5.x.x` is bundling `solidity@v0.5`.
- Version `4.1.15` is bundling `solidity@v0.4.25`.

A better solution is to upgrade to `v5` and allow compilers configs: <https://github.com/aragon/aragon-cli/issues/498>

### ignore

Version 5 breaks our tool: [travis-log][ignore-fail-log]

Migration guide: [4x to 5x][ignore-migration-guide]

### ganache (aragen dependency)

Version `2.5.5` seems to break the publish process with:  
`TypeError: Cannot read property '0' of undefined`  
This error is tracked here: <https://github.com/trufflesuite/ganache-core/issues/417>  
Seems to affect `2.5.6` too.  

Solution: pin to `2.5.3` for `ganache-core` and & `~6.2.2` for `ganache-cli`.

### web3

Because `ganache@2.2.1` is using `web3@1.0.0-beta.34` we ought to do the same, otherwise we get:  
`Error: Method [object Object] not supported`  
See more details [here][web3-gh-issue].  
Update: `1.0.0-beta.35` seems to work as well.

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
[web3-gh-issue]: https://github.com/aragon/aragon-cli/issues/457
