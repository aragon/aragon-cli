# Changelog

All notable changes to this project will be documented in this file.

## 2019-06-16 - [v5.10.0]

---

### What’s changed in aragonCLI

### 🚀 New features

* New flag `--apm.ipfs.gateway` used to read artifacts from.
  Defaults to `http://localhost:8080/ipfs`, but some defaults environment now point to `https://ipfs.eth.aragon.network/ipfs`, see [environments.default.json](https://github.com/aragon/aragon-cli/blob/master/packages/aragon-cli/config/environments.default.json) (#519)

### 💡 Feature updates

* Update the GUI client to `v0.7.4` (#519)

### 🐛 Bug Fixes

* Fix `Could not create transaction due to missing app artifact` by pinning `@aragon/wrapper` to `v5.0.0-rc.9`, see <https://github.com/aragon/aragon.js/issues/325> (#519)

### 🛠️ Maintenance & internal changes

* Add the `strict` option to yargs so the aragonCLI will not error if an argument is wrongly typed or if a command does not exist (#519)
* Fix the `--silent` and `--debug` flag that broke in `v5.9.6` when updating to `yargs@13` (#519)
* Set-up some [probot](https://probot.github.io) apps (#517, #518)

## 2019-06-12 - [v5.9.6]

---

### What’s changed in aragonCLI

### 💡 Feature updates

* Change the default ipfs gateway on non-local environments (#455) @0xGabi
* Require artifacts when fetching published repo (#332) @mikec

### 🛠️ Maintenance & internal changes

* Update to yargs 13 (#510) @0xGabi
* Add the `funded💰` label (#502) @0xGabi
* Update CONTRIBUTING.md with Bounties section 🦅 (#507) @0xGabi

## 2019-06-06 - [v5.9.5]

---

### What’s changed in aragonCLI

### 🛠️ Maintenance & internal changes

* Add code coverage (#493) @0x6431346e
* Set-up continuous deployment (#513) @0x6431346e

## 2019-06-02 - [v5.9.4]

---

### What’s changed in aragonCLI

### 💡 Feature updates

* Update `dao install` to always show the proxy address (#478) @fabriziovigevani

### 🐛 Bug Fixes

* Fix an issue with parsing args caused by `yargs@13` (#490) @0xGabi
  
## 2019-05-27 - [v5.9.3] (🌳 STABLE)

---

### What’s changed in aragonCLI

### 🐛 Bug Fixes

* Fix `Cannot find any-observable` caused by `lint-staged@8.1.0` (#485) @0xGabi

[v5.10.0]: https://github.com/aragon/aragon-cli/compare/v5.9.6...v5.10.0
[v5.9.6]: https://github.com/aragon/aragon-cli/compare/v5.9.5...v5.9.6
[v5.9.5]: https://github.com/aragon/aragon-cli/compare/v5.9.4...v5.9.5
[v5.9.4]: https://github.com/aragon/aragon-cli/compare/v5.9.3...v5.9.4
[v5.9.3]: https://github.com/aragon/aragon-cli/compare/v5.9.2...v5.9.3
