# Continuous Integration

Having CI configured in an automated way, allows us to:

- make the reviewing task less time-consuming and less prone to human errors
- reduce the feedback loop between the contributor and the reviewer

## Setup

### GitHub Actions

The configuration file is located at `.github/main.workflow`.

### Coverage

We record the test coverage history using [codecov](https://codecov.io/).

Each project has a script to run the tests and report them in the `lcov` format for `codecov`,
as well as `text` for humans.
(see [available reporters](https://istanbul.js.org/docs/advanced/alternative-reporters/))

```json
    "test:coverage": "nyc --all --reporter text --reporter text-summary --reporter lcovonly  npm run test"
```

Notes:

- we use the `--all` flag to include all the files (not just the ones touched by our tests)
- we use the `--exclude` flag to not include files like configs in the coverage reports
- the coverage is only calculated for unit & integration tests.

Because we are using a monorepo structure, we need to merge the lcov results before passing them to
coveralls.

```json
    "report-coverage": "lcov-result-merger 'packages/*/coverage/lcov.info' | coveralls",
```

## Known issues

### GitHub Actions and the `prepare` script

Our `install` action is unable to call the `prepare` script automatically, it fails with:

```sh
npm WARN lifecycle @aragon/cli-monorepo@~prepare: cannot run in wd @aragon/cli-monorepo@ npm run bootstrap && npm run bootstrap-e2e-tests (wd=/github/workspace)
```

This is most likely because of `go-ipfs` and `gyp`, see [running Aragon in docker for development](https://github.com/aragon/aragon-cli/issues/374).

The solution is to use the [`--unsafe-perm` flag](https://docs.npmjs.com/misc/config#unsafe-perm).
