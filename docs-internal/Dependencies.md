# Dependencies

## Greenkeeper

We have setup [greenkeeper][greenkeeper-home] to take care of updating dependencies to their latest
versions.

The configuration file is located at `greenkeeper.json`.

## Lock files

We are using [npm shrinkwrap][shrinkwrap-home] for the reasons described [here][shrinkwrap-issue].

### Regenerate the lockfiles

Example:

```sh
npm run delete-lockfiles
npm run bootstrap
npm run bootstrap
npm run create-lockfiles
npm run fix-lockfiles
```

Why do we run bootstrap twice?

`npm` will actually fix the lockfiles the second time around, e.g.:

```diff
-    "websocket": "websocket@git://github.com/frozeman/WebSocket-Node.git#6c72925e3f8aaaea8dc8450f97627e85263999f2"
+    "websocket": "git://github.com/frozeman/WebSocket-Node.git#browserifyCompatible"
```

Why do we need the `fix-lockfile` script?

Some packages like `async-eventemitter` are still getting messed up by `npm`, e.g.:

```diff
-    "from": "async-eventemitter@github:ahultgren/async-eventemitter#fa06e39e56786ba541c180061dbf2c0a5bbf951c"
+    "resolved": "github:ahultgren/async-eventemitter#fa06e39e56786ba541c180061dbf2c0a5bbf951c",
```

(Green is how they should look like)

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

[greenkeeper-home]: https://greenkeeper.io
[shrinkwrap-home]: https://docs.npmjs.com/cli/shrinkwrap.html
[shrinkwrap-issue]: https://github.com/aragon/aragon-cli/issues/477
[ignore-fail-log]: https://travis-ci.org/aragon/aragon-cli/jobs/536290327#L945
[ignore-migration-guide]: https://travis-ci.org/aragon/aragon-cli/jobs/536290327#L945
[web3-gh-issue]: https://github.com/aragon/aragon-cli/issues/457
