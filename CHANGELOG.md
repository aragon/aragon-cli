# Changelog

All notable changes to this project will be documented in this file.

- [Changelog](#Changelog)
  - [v5.10.0](#v5100)
    - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI)
    - [🚀 New features](#%F0%9F%9A%80-New-features)
    - [💡 Feature updates](#%F0%9F%92%A1-Feature-updates)
    - [🐛 Bug Fixes](#%F0%9F%90%9B-Bug-Fixes)
    - [🛠️ Maintenance & internal changes](#%F0%9F%9B%A0%EF%B8%8F-Maintenance--internal-changes)
  - [v5.9.6](#v596)
    - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI-1)
    - [💡 Feature updates](#%F0%9F%92%A1-Feature-updates-1)
    - [🛠️ Maintenance & internal changes](#%F0%9F%9B%A0%EF%B8%8F-Maintenance--internal-changes-1)
  - [v5.9.5](#v595)
    - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI-2)
    - [🛠️ Maintenance & internal changes](#%F0%9F%9B%A0%EF%B8%8F-Maintenance--internal-changes-2)
  - [v5.9.4](#v594)
    - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI-3)
    - [💡 Feature updates](#%F0%9F%92%A1-Feature-updates-2)
    - [🐛 Bug Fixes](#%F0%9F%90%9B-Bug-Fixes-1)
  - [v5.9.3](#v593)
    - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI-4)
    - [🐛 Bug Fixes](#%F0%9F%90%9B-Bug-Fixes-2)
  - [v5.9.2](#v592)
    - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI-5)
    - [🐛 Bug Fixes](#%F0%9F%90%9B-Bug-Fixes-3)
  - [v5.9.1](#v591)
    - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI-6)
    - [🐛 Bug Fixes](#%F0%9F%90%9B-Bug-Fixes-4)
  - [v5.9.0](#v590)
    - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI-7)
    - [💡 Feature updates](#%F0%9F%92%A1-Feature-updates-3)
    - [🛠️ Maintenance & internal changes](#%F0%9F%9B%A0%EF%B8%8F-Maintenance--internal-changes-3)
  - [v5.8.0](#v580)
  - [v5.7.2](#v572)
  - [v5.7.1](#v571)
  - [v5.7.0](#v570)
  - [v5.6.2](#v562)
  - [v5.6.1](#v561)
  - [v5.6.0](#v560)
  - [v5.5.0](#v550)
  - [v5.4.0](#v540)
  - [v5.3.3](#v533)
  - [v5.3.2](#v532)
  - [v5.3.1](#v531)
  - [v5.3.0](#v530)
  
---

## v5.10.0

Release date: **2019-06-16**  
[Compare code changes][v5.10.0]

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

---

## v5.9.6

Release date: **2019-06-12**  
[Compare code changes][v5.9.6]

### What’s changed in aragonCLI

### 💡 Feature updates

* Change the default ipfs gateway on non-local environments (#455) @0xGabi
* Require artifacts when fetching published repo (#332) @mikec

### 🛠️ Maintenance & internal changes

* Update to yargs 13 (#510) @0xGabi
* Add the `funded💰` label (#502) @0xGabi
* Update CONTRIBUTING.md with Bounties section 🦅 (#507) @0xGabi

---

## v5.9.5

Release date: **2019-06-06**  
[Compare code changes][v5.9.5]

### What’s changed in aragonCLI

### 🛠️ Maintenance & internal changes

* Add code coverage (#493) @0x6431346e
* Set-up continuous deployment (#513) @0x6431346e

---

## v5.9.4

Release date: **2019-06-02**  
[Compare code changes][v5.9.4]

### What’s changed in aragonCLI

### 💡 Feature updates

* Update `dao install` to always show the proxy address (#478) @fabriziovigevani

### 🐛 Bug Fixes

* Fix an issue with parsing args caused by `yargs@13` (#490) @0xGabi
  
---

## v5.9.3

Release date: **2019-05-27**  
[Compare code changes][v5.9.3] (🌳 STABLE)

### What’s changed in aragonCLI

### 🐛 Bug Fixes

* Fix `Cannot find any-observable` caused by `lint-staged@8.1.0` (#485) @0xGabi

---

## v5.9.2

Release date: **2019-05-26**  
[Compare code changes][v5.9.2]

### What’s changed in aragonCLI

### 🐛 Bug Fixes

* Downgrade yargs to v12 because v13 caused `--silent` and `--debug` to not work (#484 ) (Fixed in `v5.10.0`)

---

## v5.9.1

Release date: **2019-05-24**  
[Compare code changes][v5.9.1]

### What’s changed in aragonCLI

### 🐛 Bug Fixes

* Re-published because `lerna` [screwed up the lock file](https://github.com/aragon/aragon-cli/blob/v5.9.1/docs-internal/Dependencies.md#regenerate-the-lockfiles) when publishing (`async-eventemitter`) making `v5.9.0` uninstallable.

---

## v5.9.0

Release date: **2019-05-24**  
[Compare code changes][v5.9.0]

### What’s changed in aragonCLI

### 💡 Feature updates

* `aragon apm versions` now accepts a `[apmRepo]` parameter to inspect packages, other than the one in `arapp.json` (#458)
* the APM timeout has been increased to 5 minutes and made configurable in the `package.json` of the CLI (you can tweak it by building from source) (#481)

### 🛠️ Maintenance & internal changes

* Update dependencies (#483)
* Add shrinkwrap files (#483)
* `aragon run` now has an end-to-end test (#483)

---

## v5.8.0

Release date: **2019-05-18**  
[Compare code changes][v5.8.0]

## v5.7.2

Release date: **2019-05-18**  
[Compare code changes][v5.7.2]

## v5.7.1

Release date: **2019-05-04**  
[Compare code changes][v5.7.1]

## v5.7.0

Release date: **2019-04-27**  
[Compare code changes][v5.7.0]

## v5.6.2

Release date: **2019-04-17**  
[Compare code changes][v5.6.2]

## v5.6.1

Release date: **2019-03-25**  
[Compare code changes][v5.6.1]

## v5.6.0

Release date: **2019-03-25**  
[Compare code changes][v5.6.0]

## v5.5.0

Release date: **2019-03-12**  
[Compare code changes][v5.5.0]

## v5.4.0

Release date: **2019-02-27**  
[Compare code changes][v5.4.0]

## v5.3.3

Release date: **2019-01-29**  
[Compare code changes][v5.3.3]

## v5.3.2

Release date: **2019-01-18**  
[Compare code changes][v5.3.2]

## v5.3.1

Release date: **2019-01-18**  
[Compare code changes][v5.3.1]

## v5.3.0

Release date: **2019-01-17**  
[Compare code changes][v5.3.0]

[v5.10.0]: https://github.com/aragon/aragon-cli/compare/v5.9.6...v5.10.0
[v5.9.6]: https://github.com/aragon/aragon-cli/compare/v5.9.5...v5.9.6
[v5.9.5]: https://github.com/aragon/aragon-cli/compare/v5.9.4...v5.9.5
[v5.9.4]: https://github.com/aragon/aragon-cli/compare/v5.9.3...v5.9.4
[v5.9.3]: https://github.com/aragon/aragon-cli/compare/v5.9.2...v5.9.3
[v5.9.2]: https://github.com/aragon/aragon-cli/compare/v5.9.1...v5.9.2
[v5.9.1]: https://github.com/aragon/aragon-cli/compare/v5.9.0...v5.9.1
[v5.9.0]: https://github.com/aragon/aragon-cli/compare/v5.8.0...v5.9.0
[v5.8.0]: https://github.com/aragon/aragon-cli/compare/v5.7.2...v5.8.0
[v5.7.2]: https://github.com/aragon/aragon-cli/compare/v5.7.1...v5.7.2
[v5.7.1]: https://github.com/aragon/aragon-cli/compare/v5.7.0...v5.7.1
[v5.7.0]: https://github.com/aragon/aragon-cli/compare/v5.6.2...v5.7.0
[v5.6.2]: https://github.com/aragon/aragon-cli/compare/v5.6.1...v5.6.2
[v5.6.1]: https://github.com/aragon/aragon-cli/compare/v5.6.0...v5.6.1
[v5.6.0]: https://github.com/aragon/aragon-cli/compare/v5.5.0...v5.6.0
[v5.5.0]: https://github.com/aragon/aragon-cli/compare/v5.4.0...v5.5.0
[v5.4.0]: https://github.com/aragon/aragon-cli/compare/v5.3.3...v5.4.0
[v5.3.3]: https://github.com/aragon/aragon-cli/compare/v5.3.2...v5.3.3
[v5.3.2]: https://github.com/aragon/aragon-cli/compare/v5.3.1...v5.3.2
[v5.3.1]: https://github.com/aragon/aragon-cli/compare/v5.3.0...v5.3.1
[v5.3.0]: https://github.com/aragon/aragon-cli/compare/v5.2.3...v5.3.0
