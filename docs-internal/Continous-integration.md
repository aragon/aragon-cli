# Continous Integration

Having automated CI setup allows us to:

- reduce the feedback loop between the contributor and the reviewer
- make the reviewing task less time-consuming and less prone to human errors

## GitHub Actions

The configuration file is located at `.github/main.workflow`.

## Travis CI

The configuration file is located at `.travis.yml`.

## Known issues

### Cannot bootstrap all packages concurrently

Our `@aragon/cli-e2e-tests` package has the following dependencies:

```json
    "@aragon/cli": "file:../aragon-cli",
    "create-aragon-app": "file:../create-aragon-app",
```

These dependencies need to be built **before** we install them, otherwise `npm` will not create
the binaries in `node_modules/.bin` correctly.

The solution is to split the bootstrapping process in two:

```json
    "prepare": "npm run bootstrap && npm run bootstrap-e2e-tests",
    "bootstrap": "lerna bootstrap --no-ci --ignore @aragon/cli-e2e-tests",
    "bootstrap-e2e-tests": "lerna bootstrap --no-ci --scope @aragon/cli-e2e-tests",
```

Note: this works because when we bootstrap a package, it will get built right after thanks to the
`prepare` script.

Learn more about [`lerna bootstrap`](https://github.com/lerna/lerna/tree/master/commands/bootstrap#readme)
and [npm's `prepare` script](https://docs.npmjs.com/misc/scripts).

### GitHub Actions and the `prepare` script

Our `install` action is unable to call the `prepare` script automatically, it fails with:

```sh
npm WARN lifecycle @aragon/cli-monorepo@~prepare: cannot run in wd @aragon/cli-monorepo@ npm run bootstrap && npm run bootstrap-e2e-tests (wd=/github/workspace)
```

This is most likely because of `go-ipfs` and `gyp`, see [running Aragon in docker for development](https://github.com/aragon/aragon-cli/issues/374).

The solution is to use the [`--unsafe-perm` flag](https://docs.npmjs.com/misc/config#unsafe-perm).
