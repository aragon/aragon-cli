# Changelog

All **notable** changes between stable versions will be documented in this file.

- [Changelog](#Changelog)
  - [v6.0.x (not marked as stable yet)](#v60x-not-marked-as-stable-yet)
    - [What’s changed in aragonCLI since `v5.9.3`](#Whats-changed-in-aragonCLI-since-v593)
    - [🚀 New features](#%F0%9F%9A%80-New-features)
    - [💡 Feature updates](#%F0%9F%92%A1-Feature-updates)
    - [🐛 Bug Fixes](#%F0%9F%90%9B-Bug-Fixes)
    - [🛠️ Maintenance & internal changes](#%F0%9F%9B%A0%EF%B8%8F-Maintenance--internal-changes)
  
---

## v6.0.x (not marked as stable yet)

Release date: **2019-07-07**  
[Compare code changes][v6.0.4]

### What’s changed in aragonCLI since `v5.9.3`

### 🚀 New features

* New flag `--apm.ipfs.gateway` used to read APM artifacts from.
  Defaults to `http://localhost:8080/ipfs`, but some defaults environment now point to `https://ipfs.eth.aragon.network/ipfs`, see [environments.default.json](https://github.com/aragon/aragon-cli/blob/master/packages/aragon-cli/config/environments.default.json) (#519)
* Make go-ipfs optional (#528) @0x6431346e
   * Introduce three new IPFS commands: `aragon ipfs install`, `aragon ipfs uninstall` and `aragon ipfs status`
* Output publish information before publishing when using `aragon apm publish` (#574) @0xGabi
   * Refactor the whole publish process prompting the user to decide if:
      * Publish the content to aragonPM repo
      * Propagate the content through IPFS (if applicable)
* Sanity check `artifact.json` generation and include the `deprecated` key on `artifact.json`. This new key have the information of the deprecated functions between different contract version published (#426) @0xGabi


### 💡 Feature updates

* Update `dao install` to always show the proxy address (#478) @fabriziovigevani
* Change the default ipfs gateway on non-local environments (#455) @0xGabi
* Require artifacts when fetching published repo (#332) @mikec
* Update the GUI client to `v0.7.4` (#519)
* Update `dao token new` options to use a deployed `minimeTokenFactory` in Rinkeby and Mainnet as default (#555) @0xGabi
* Refactor artifact generation & improve sanity check (#570) @0xGabi
* New prepublish option for `aragon apm publish` that allow to run a script before publish the app (#571) @0xGabi
* Pass apm opts to @aragon/wrapper (#567) @0x6431346e
* Add a new option `token-factory-address` to `dao token new` (#555) @0xGabi

### 🐛 Bug Fixes

* Fix an issue with parsing args caused by `yargs@13` (#490) @0xGabi
* Fix `Could not create transaction due to missing app artifact` by pinning `@aragon/wrapper` to `v5.0.0-rc.9`, see <https://github.com/aragon/aragon.js/issues/325> (#519)
* Fix parsing for booleans, arrays & numbers in several commands (#555) @0xGabi
  
### 🛠️ Maintenance & internal changes

* Add code coverage (#493) @0x6431346e
* Set-up continuous deployment (#513) @0x6431346e
* Update to yargs 13 (#510) @0xGabi
* Add the `funded💰` label (#502) @0xGabi
* Update CONTRIBUTING.md with Bounties section 🦅 (#507) @0xGabi
* Add the `strict` option to yargs so the aragonCLI will not error if an argument is wrongly typed or if a command does not exist (#519)
* Fix the `--silent` and `--debug` flag that broke in `v5.9.6` when updating to `yargs@13` (#519)
* Set-up some [probot](https://probot.github.io) apps (#517, #518)
* Include documentation about links (#543) @0xGabi
* Update apm docs (#525) @0x6431346e
* Add appveyor.yml (#562) @0xGabi
* Fix e2e test setup (#545) @0xGabi
* Fix lockfiles (#550) @0x6431346e
* Update dependencies (#526) @0x6431346e
* Add CHANGELOG.md (#523) @0x6431346e
* Update aragonCLI Roadmap (#504) @0xGabi
* Bump eslint-plugin-import from 2.17.3 to 2.18.0 (#556) @dependabot-preview
* Bump husky from 2.4.1 to 3.0.0 (#575) @dependabot-preview
* Bump truffle-hdwallet-provider from 1.0.10 to 1.0.13 (#577) @dependabot-preview
* Bump semver from 6.1.1 to 6.2.0 (#576) @dependabot-preview
* Add pre-requisites section (#559) @chrishobcroft
* Update lockfiles (#591)
* Rename `create-lockfiles` script to `convert-lockfiles` (#591)
* Update CHANGELOG.md (#589)
* Improve deploy logs & update releasing document (#592)

[v6.0.4]: https://github.com/aragon/aragon-cli/compare/v5.9.3...v6.0.4
