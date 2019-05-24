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

### truffle

We cannot use `truffle@v5` nor `truffle@v4.1.15`, because the `aragonOS` contracts need to be
compiled with `solidity@v0.4.24`.

- Version `5.x.x` is bundling `solidity@v0.5`.
- Version `4.1.15` is bundling `solidity@v0.4.25`.

### ignore

Version 5 breaks our tool: [travis-log][ignore-fail-log]

Migration guide: [4x to 5x][ignore-migration-guide]

### ganache

Version `2.5.5` seems to break the publish process:

```sh
daniel@zen5-ub:~/r/aragon/pg/foo$ aragon run --debug
  ✔ Start a local Ethereum network
  ✔ Check IPFS
  ❯ Publish app to APM
    ✔ Applying version bump (major)
    ✔ Deploy contract
    ✔ Determine contract address for version
    ✔ Building frontend
    ✔ Prepare files for publishing
    ✔ Generate application artifact
    ❯ Publish foo.aragonpm.eth
      ⠼ Generating transaction
        → Fetching DAO at 0x983b4Df4E8458D56CFDC51B9d2149381AF80308A...
        Sending transaction
      Fetch published repo
    Create DAO
    Open DAO

/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/lib/utils/gasEstimation.js:88
      rootBegin: steps.systemOps[begin][0],
                                       ^
TypeError: Cannot read property '0' of undefined
    at findRootScope (/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/lib/utils/gasEstimation.js:88:40)
    at getTotal (/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/lib/utils/gasEstimation.js:155:36)
    at getTotal (/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/lib/utils/gasEstimation.js:221:23)
    at getTotal (/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/lib/utils/gasEstimation.js:192:25)
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/lib/utils/gasEstimation.js:42:21
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/ethereumjs-vm/dist/runTx.js:70:9
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/async/dist/async.js:969:16
    at next (/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/async/dist/async.js:5225:18)
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/ethereumjs-vm/dist/cache.js:160:13
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/merkle-patricia-tree/util.js:51:36
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/merkle-patricia-tree/node_modules/async/lib/async.js:52:16
    at done (/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/merkle-patricia-tree/node_modules/async/lib/async.js:246:17)
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/merkle-patricia-tree/node_modules/async/lib/async.js:44:16
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/lib/database/levelupobjectadapter.js:110:7
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/async/dist/async.js:473:16
    at iteratorCallback (/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/async/dist/async.js:1064:13)
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/async/dist/async.js:969:16
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/level-sublevel/shell.js:53:51
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/level-sublevel/nut.js:109:13
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/lib/database/filedown.js:64:7
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/async/dist/async.js:473:16
    at iteratorCallback (/home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/async/dist/async.js:1064:13)
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/ganache-core/node_modules/async/dist/async.js:969:16
    at /home/daniel/r/aragon/aragon-cli/packages/aragon-cli/node_modules/graceful-fs/graceful-fs.js:45:10
    at FSReqCallback.args [as oncomplete] (fs.js:145:20)
```

Solution: pin to `2.2.1` which is the latest we've tested.

### web3

Because `ganache@2.2.1` is using `web3@1.0.0-beta.34` we ought to do the same, otherwise we get:

`Error: Method [object Object] not supported`

See more details [here][web3-gh-issue].

## Tips

- To pin a dependency:

```sh
npm install --save --save-exact web3@1.0.0-beta.34
```

- To downgrade a dependency:

```sh
npm install --save ignore@4
```

Note: sometimes you need to [regenerate the lockfiles](#regenerate-the-lockfiles) when you install
a new package, because the automatic updates prove very unreliable.

[greenkeeper-home]: https://greenkeeper.io
[shrinkwrap-home]: https://docs.npmjs.com/cli/shrinkwrap.html
[shrinkwrap-issue]: https://github.com/aragon/aragon-cli/issues/477
[ignore-fail-log]: https://travis-ci.org/aragon/aragon-cli/jobs/536290327#L945
[ignore-migration-guide]: https://travis-ci.org/aragon/aragon-cli/jobs/536290327#L945
[web3-gh-issue]: https://github.com/aragon/aragon-cli/issues/457
