# Changelog

All **notable** changes between stable versions will be documented in this file.

- [Changelog](#Changelog)
  - [v6.0.x (not marked as stable yet)](#v60x-not-marked-as-stable-yet)
    - [What’s changed in aragonCLI since `v5.9.3`](#Whats-changed-in-aragonCLI-since-v593)
    - [💥 Breaking changes](#%F0%9F%92%A5-Breaking-changes)
    - [🚀 New features](#%F0%9F%9A%80-New-features)
    - [💡 Feature updates](#%F0%9F%92%A1-Feature-updates)
    - [🐛 Bug Fixes](#%F0%9F%90%9B-Bug-Fixes)
    - [🛠️ Maintenance & internal changes](#%F0%9F%9B%A0%EF%B8%8F-Maintenance--internal-changes)
  
---

## v6.0.x (not marked as stable yet)

Release date: **2019-07-07**
[Compare code changes][v6.0.4]

### What’s changed in aragonCLI since `v5.9.3`

### 💥 Breaking changes

- `ipfs` is no longer installed by default, you need to call `aragon ipfs install`.
- `aragon apm publish` now requires confirmation, use the `--skip-confirmation` flag to migrate your scripts or CI configs.

### 🚀 New features

* New flag `--apm.ipfs.gateway` used to read APM artifacts from.
  Defaults to `http://localhost:8080/ipfs`, but some defaults environment now point to `https://ipfs.eth.aragon.network/ipfs`, see [environments.default.json](https://github.com/aragon/aragon-cli/blob/master/packages/aragon-cli/config/environments.default.json) (#519)
* Make go-ipfs optional (#528)
   * Introduce three new IPFS commands: `aragon ipfs install`, `aragon ipfs uninstall` and `aragon ipfs status`
* Output publish information before publishing when using `aragon apm publish` (#574)
   * Refactor the whole publish process prompting the user to decide if:
      * Publish the content to aragonPM repo
      * Propagate the content through IPFS (if applicable)
* Sanity check `artifact.json` generation and include the `deprecated` key on `artifact.json`. This new key have the information of the deprecated functions between different contract version published (#426)
* New option `--prepublish` for `aragon apm publish` to specify whether to run a prepublish script specified in `package.json`. The script if defined with the option `--prepublish-script` (defaults to prepublishOnly) (#571)

### 💡 Feature updates

* Update the GUI client to `v0.7.4` (#519)
* Update `dao install` to always show the proxy address (#478)
* Update `dao token new` options to use a deployed `minimeTokenFactory` in Rinkeby and Mainnet as default to save gas (#555)
* Pass apm opts to @aragon/wrapper (#567)

### 🐛 Bug Fixes

* Fix `Could not create transaction due to missing app artifact` by pinning `@aragon/wrapper` to `v5.0.0-rc.9`, see <https://github.com/aragon/aragon.js/issues/325> (#519)
* Fix parsing for booleans, arrays & numbers in several commands (#555)
* Require artifacts when fetching published repo during `aragon run` (#332)
  
### 🛠️ Maintenance & internal changes

* Set-up code coverage (#493)
* Set-up continuous deployment (#513)
* Set-up some [probot](https://probot.github.io) apps (#517, #518)
* Add pre-requisites section to docs (#559)
* Update CONTRIBUTING.md with Bounties section 🦅 (#507)
* Update aragonCLI Roadmap (#504)

[v6.0.4]: https://github.com/aragon/aragon-cli/compare/v5.9.3...v6.0.4
