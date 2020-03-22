![aragonCLI logo](/docs/assets/brand/aragoncli.png)

<div align="center">
  <!-- Downloads -->
  <a href="https://npmjs.org/package/@aragon/cli">
    <img src="https://img.shields.io/npm/dm/@aragon/cli.svg?style=flat-square"
      alt="Downloads" />
  </a>
  <!-- Standard -->
  <a href="https://standardjs.com">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square"
      alt="Standard" />
  </a>
  <!-- Lerna -->
  <a href="https://lerna.js.org/">
    <img src="https://img.shields.io/badge/maintained%20with-lerna-blueviolet.svg?style=flat-square"
      alt="Lerna" />
  </a>
</div>

<div align="center">
  <h4>
    <a href="https://aragon.org">
      Website
    </a>
    <span> | </span>
    <a href="https://hack.aragon.org/docs/cli-intro.html">
      Documentation
    </a>
    <span> | </span>
    <a href="CHANGELOG.md">
      Changelog
    </a>
    <span> | </span>
    <a href="CONTRIBUTING.md">
      Contributing
    </a>
    <span> | </span>
    <a href="https://spectrum.chat/aragon/?tab=posts">
      Chat
    </a>
  </h4>
</div>

# aragonCLI

![Merge on master and develop](https://github.com/aragon/aragon-cli/workflows/Merge%20on%20master%20and%20develop/badge.svg)

The aragonCLI (Command Line Interface) is used to create and develop Aragon Apps, as well as to
interact with DAOs (create, install apps, inspect permissions, etc.).

## Stable builds 🌳

[![NPM][latest-stable-npm-badge]][npm-link]
[![Docs][latest-stable-docs-badge]][latest-stable-docs-link]
[![API stability][stability-stable-badge]][stability-docs-link]

Periodically, after some testing has been done, we mark `nightly` builds as `stable`.
This build is recommended to most people, especially devs that are getting started and not familiar
with the stack, or anyone who values stability over the bleeding-edge features.

```sh
npm install --global @aragon/cli
```

To install an older version:

```sh
npm install --global @aragon/cli@5.6.2
```

[latest-stable-npm-badge]: https://img.shields.io/npm/v/@aragon/cli/stable.svg?style=flat-square
[latest-stable-docs-badge]: https://img.shields.io/badge/docs-latest%20stable-blue.svg?style=flat-square
[latest-stable-docs-link]: https://hack.aragon.org/docs/cli-intro.html

## Nightly builds 🌒

[![NPM version][nightly-npm-badge]][npm-link]
[![Docs][nightly-docs-badge]][nightly-docs-link]
[![API stability][stability-experimental-badge]][stability-docs-link]
[![codecov](https://codecov.io/gh/aragon/aragon-cli/branch/develop/graph/badge.svg)](https://codecov.io/gh/aragon/aragon-cli)

Nightly builds may contain features in their early stages, expect things to break!

**Get a sneak peek at the next version of the CLI, and help us making it better in the process!**
**Please try it out and let us know early and often if you find any bugs or regressions. Thanks!**

```sh
npm install --global @aragon/cli@nightly
```

[nightly-npm-badge]: https://img.shields.io/npm/v/@aragon/cli/nightly.svg?style=flat-square&color=blueviolet
[nightly-docs-badge]: https://img.shields.io/badge/docs-master-blue.svg?style=flat-square
[nightly-docs-link]: https://hack.aragon.org/docs/cli-intro.html
[nightly-coverage-badge]: https://img.shields.io/coveralls/aragon/aragon-cli.svg?style=flat-square
[nightly-coverage-link]: https://coveralls.io/github/aragon/aragon-cli
[npm-link]: https://npmjs.org/package/@aragon/cli
[stability-stable-badge]: https://img.shields.io/badge/stability-stable-brightgreen.svg?style=flat-square
[stability-experimental-badge]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[stability-docs-link]: https://nodejs.org/api/documentation.html#documentation_stability_index

## Related packages

| Package             | Version (latest/stable)                               | Version (nightly)                                             | Downloads                                                 |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| `create-aragon-app` | [![NPM version][caa-npm-badge]][caa-npm-link]         | [![NPM version][caa-npm-badge-nightly]][caa-npm-link]         | [![Downloads][caa-downloads-badge]][caa-npm-link]         |
| `toolkit`           | [![NPM version][toolkit-npm-badge]][toolkit-npm-link] | [![NPM version][toolkit-npm-badge-nightly]][toolkit-npm-link] | [![Downloads][toolkit-downloads-badge]][toolkit-npm-link] |

[caa-npm-badge]: https://img.shields.io/npm/v/create-aragon-app/latest.svg?style=flat-square
[caa-npm-link]: https://npmjs.org/package/create-aragon-app
[caa-npm-badge-nightly]: https://img.shields.io/npm/v/create-aragon-app/nightly.svg?style=flat-square&color=blueviolet
[caa-downloads-badge]: https://img.shields.io/npm/dm/create-aragon-app.svg?style=flat-square
[toolkit-npm-badge]: https://img.shields.io/npm/v/@aragon/toolkit/latest.svg?style=flat-square
[toolkit-npm-link]: https://npmjs.org/package/@aragon/toolkit
[toolkit-npm-badge-nightly]: https://img.shields.io/npm/v/@aragon/toolkit/nightly.svg?style=flat-square&color=blueviolet
[toolkit-downloads-badge]: https://img.shields.io/npm/dm/@aragon/toolkit.svg?style=flat-square

## Internal documents regarding the project development & maintenance

- [CI](/docs-internal/Continuous-integration.md) - The Continuous-integration approach
- [CD](/docs-internal/Continuous-deployment.md) - The Continuous-deployment approach
- [Releasing](/docs-internal/Releasing.md) - Releasing guidelines
- [Reviewing](/docs-internal/Reviewing.md) - Reviewing guidelines
- [Testing](/docs-internal/Testing.md) - Testing guidelines
- [Dependencies](/docs-internal/Dependencies.md) - Dependencies guidelines
