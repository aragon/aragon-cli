# Continuous Deployment

Having CD configured in an automated way, allows us to:

- make the release task less time-consuming and less prone to human errors
- decrease the attack surface by not needing maintainers to have publish access

## Setup

### Travis CI

The configuration file is located at `.travis.yml`.

Requirements: this configuration assumes a `NPM_TOKEN` environment variable defined in Travis's
settings. (see [travis docs about env vars][travis-docs-env-vars])

Notes:

- `before_deploy`
  
  This hook runs after the build and testing steps have finished, and is purpose is twofold:

  1. Clean-up uncommitted changes resulted from installing or building, e.g.: lockfiles
  2. Grant the `npm` agent publish access

- `deploy`

  The deploy step uses lerna to publish packages that have been released, but not deployed on `npm`:

  ```json
    "publish:nightly": "lerna publish from-package --dist-tag nightly --yes"
  ```
  
  The `skip_cleanup` flag tells Travis not to delete files not tracked by git,
  such as the build directory of the packages: `dist`.

  This step runs only on the v11 of `Node` whenever there are new tags.
  (see [`Releasing.md`](/docs-internal/Releasing.md))

## Useful readings

- [lerna publish docs](https://github.com/lerna/lerna/tree/master/commands/publish)
  (in particular the `from-package` positional and the `--dist-tag` and `--yes` flags)
- [lerna + travis setup demo](https://github.com/geut/lerna-travis-demo)
- [travis deployment docs](https://docs.travis-ci.com/user/deployment/)

[travis-docs-env-vars]: https://docs.travis-ci.com/user/environment-variables/#defining-variables-in-repository-settings
