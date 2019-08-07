# End-to-end tests

To test only one file, try:

```sh
npm test -- src/cli/version.test.js
```

or, without running the pretest/posttest hooks:

```sh
npx ava src/cli/version.test.js
```

## Local environment

Some commands like `aragon run` depend on a local dev environment (ipfs, ganache).

We set up this up during the `pretest` hook & tear it down during the `posttest` hook.

Pretest:

* Start IPFS
* Start Ganache
* Create a test app

Posttest:

* Stop IPFS
* Stop Ganache
* Delete the test app

**Tip**: Did a test fail and the local environment was not cleaned up? Try `npm run test:clean`.
