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
  <!-- Greenkeeper -->
  <a href="https://greenkeeper.io">
    <img src="https://badges.greenkeeper.io/aragon/aragon-cli.svg?style=flat-square"
      alt="Greenkeeper" />
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
    <a href="CONTRIBUTING.md">
      Contributing
    </a>
    <span> | </span>
    <a href="https://aragon.chat">
      Chat
    </a>
  </h4>
</div>

# aragonCLI

The aragonCLI (Command Line Interface) is used to create and develop Aragon Apps, as well as to
interact with DAOs (create, install apps, inspect permissions, etc.).

## Stable builds 🌳

[![NPM](https://img.shields.io/npm/v/@aragon/cli/stable.svg?style=flat-square)](https://npmjs.org/package/@aragon/cli)
[![Docs](https://img.shields.io/badge/docs-latest%20stable-blue.svg?style=flat-square)](https://github.com/aragon/aragon-cli/blob/master/docs/Intro.md)
[![API stability](https://img.shields.io/badge/stability-stable-brightgreen.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)

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

Older, stable versions:

| Version | NPM page | Docs |
| ------- | -------- | ---- |
| `v5.7.0` | [![NPM](https://img.shields.io/badge/npm-v5.7.0-blue.svg?style=flat-square)](https://www.npmjs.com/package/@aragon/cli/v/5.7.0) | [![Docs](https://img.shields.io/badge/docs-v5.7.0-blue.svg?style=flat-square)](https://github.com/aragon/aragon-cli/blob/v5.7.0/docs/Intro.md) |
| `v5.6.2` | [![NPM](https://img.shields.io/badge/npm-v5.6.2-blue.svg?style=flat-square)](https://www.npmjs.com/package/@aragon/cli/v/5.6.2) | [![Docs](https://img.shields.io/badge/docs-v5.6.2-blue.svg?style=flat-square)](https://github.com/aragon/aragon-cli/blob/v5.6.2/docs/Intro.md) |

<!-- | `v5.9.3` | [![NPM](https://img.shields.io/badge/npm-v5.9.3-blue.svg?style=flat-square)](https://www.npmjs.com/package/@aragon/cli/v/5.9.3) | [![Docs](https://img.shields.io/badge/docs-v5.9.3-blue.svg?style=flat-square)](https://github.com/aragon/aragon-cli/blob/v5.9.3/docs/Intro.md) | -->

## Nightly builds 🌒

[![NPM version](https://img.shields.io/npm/v/@aragon/cli/nightly.svg?style=flat-square&color=blueviolet)](https://npmjs.org/package/@aragon/cli)
[![Docs](https://img.shields.io/badge/docs-master-blue.svg?style=flat-square)](https://hack.aragon.org/docs/cli-intro.html)
[![API stability](https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)
[![Code coverage](https://img.shields.io/coveralls/aragon/aragon-cli.svg?style=flat-square)](https://coveralls.io/github/aragon/aragon-cli)
[![Build status](https://img.shields.io/travis/aragon/aragon-cli/master.svg?style=flat-square)](https://travis-ci.org/aragon/aragon-cli/branches)

Nightly builds may contain features in their early stages, expect things to break!

**Get a sneak peek at the next version of the CLI, and help us making it better in the process!**
**Please try it out and let us know early and often if you find any bugs or regressions. Thanks!**

```sh
npm install --global @aragon/cli@nightly
```

It can also be built and installed from the source code:

```sh
git clone https://github.com/aragon/aragon-cli.git
npm install
npm run link
```

## Related packages

| Package | Version (latest/stable) | Version (nightly) | Downloads |
| ------- | ----------------------- | ----------------- | --------- |
| `create-aragon-app` | [![NPM version](https://img.shields.io/npm/v/create-aragon-app/latest.svg?style=flat-square)](https://npmjs.org/package/create-aragon-app) | [![NPM version](https://img.shields.io/npm/v/create-aragon-app/nightly.svg?style=flat-square&color=blueviolet)](https://npmjs.org/package/create-aragon-app) | [![Downloads](https://img.shields.io/npm/dm/create-aragon-app.svg?style=flat-square)](https://npmjs.org/package/create-aragon-app) |
