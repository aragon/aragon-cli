# Changelog

All changes to this project will be documented in this file and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v7.0.0 - 2019-12-18 (🌳 STABLE)

### 💥 Breaking changes

- Add `@aragon/toolkit` package

### 🐛 Bug fixes

- Fix acl commands used with a dao id (#1076) @macor161
- Fix envrionments adding configure APM function (#1100) @0xGabi
- Fixes a bug where start command wouldnt open in browser (#1089) @ajsantander
- Patch to prevent long running commands to call `onFinishCommand` hook (#1032) @dapplion
- Fix `getBinary` (#1042) @0x6431346e

---

## v6.4.0 - 2019-11-14

### 🚀 New Feature

- Support ACL permissions with parameters (#807) @macor161
- Add interactive list of templates on `create-aragon-app` to choose from (#832) @dapplion

### 🐛 Bug fixes

- Remove extra 0x on keccak256 calls (#862) @macor161
- Truffle flattener cyclic dependencies error - re-work on PR #844 (#857) @ajsantander
- Import ABIs from `@aragon/os` and `@aragon/id`, to resolve #818 (#833) @dapplion

### 💡 Feature updates

- `getTransactionPath` refactor (#840) @macor161
- Displays version on `debug` mode (#839) @ajsantander

---

## v6.3.3 - 2019-09-28

### 🚀 New Feature

- Support link deployed library contracts (#804) @cslarson 🎉

### 🐛 Bug fixes

- Update wrapper to `beta.17` (#796) @macor161

### 💡 Feature updates

- Http server check on `aragon run --http` (#801) @macor161

---

## v6.3.2 - 2019-09-2 (🌳 STABLE)

### 💡 Feature updates

- Iterate `aragon run`: add `--client-repo` optional argument

### 🐛 Bug Fixes

- Fix array arguments support (#785) @macor161
- Add deploy event compatibility (#784) @macor161

---

## v6.3.1 - 2019-09-16

### 🐛 Bug Fixes

- Backward compatibility fix for the old deploy event name and the publish folder (#778) @macor161

---

## v6.3.0 - 2019-09-13

### 💡 Feature updates

- Update client to 0.8 🛣 (#765) @0xGabi
- Include `templates-args` new option (#768) @0xGabi
- Use a pre build of the client instead of building it every time 🚀(#764) @0xGabi
- Bump `@aragon/aragen` to [v5.3.2](https://github.com/aragon/aragen/releases/tag/v5.3.2)

### 🐛 Bug Fixes

- Fix deployment with new Templates (#762) @0xGabi

---

## v6.2.6 - 2019-09-04

### 💡 Feature updates

- Support `dao new` command for new templates (#669) @0xGabi

### 🐛 Bug Fixes

- Fix output for aragon run & fix http publish flag (#752) @0xGabi
- Check IPFS & install if missing (#734) @0xGabi
- Bump aragen to [v5.2.0](https://github.com/aragon/aragen/releases/tag/v5.2.0) , fix tx pathing issue with ganache version (#753) @0xGabi

---

## v6.2.5 - 2019-08-18

### 🚀 New Feature

- New Command `aragon id assign` (#707) @macor161 🙏

### 🐛 Bug Fixes

- Add Aragon's default endpoint (#713) @0xGabi

---

## v6.2.4 - 2019-08-08

### 🐛 Bug Fixes

- Fix http provider publish workflow (#701) @0xGabi

---

## v6.2.3 - 2019-08-07 (🌳 STABLE)

### 🚀 New features

- Iterate dao act: add `--eth-value` optional argument (#492) @0xGabi

### 💡 Feature updates

- Check for existing `transactionPath` in `execHandler` (#385) @mikec 🎉
- Avoid coercing number arguments from strings to JS numbers (#687) @sohkai 🎉

### 🐛 Bug Fixes

- Handle IPFS not being installed (#696) @0x6431346e

---

## v6.2.2 - 2019-08-05

### 💡 Feature updates

- Update aragen & client (#686) @0xGabi

---

## v6.2.1 - 2019-08-05

### 🐛 Bug Fixes

- Fix prepare publish function and publish intent argument (#685) @0xGabi

---

## v6.2.0 - 2019-08-01

### 🚀 New features

- New command `devchain status` (#678) @0xGabi

### 💡 Feature updates

- Bump `@aragon/aragen` to [v5.0.0](https://github.com/aragon/aragen/releases/tag/v5.0.0)
- Allow arrays to be passed via `--app-init-args` (#623) @mikec 🎉

### 🐛 Bug Fixes

- Update command to not hang after finishing (#674) @0xGabi
- Fix `decorateWithAbi` function to filter by function type (#666) @0xGabi
- Fix prepare files function to handle `--files` correctly (#660) @0xGabi

---

## v6.1.1 - 2019-07-24

---

## v6.1.0 - 2019-07-23

### 🚀 New features

- Add `gas-price` global option (#625) @0xGabi

### 💡 Feature updates

- Use all environment on artifact generation (#646) @0xGabi

### 🐛 Bug Fixes

- Project name validation (#635) @macor161 🎉
- Fix fetch repo option when publishing only content (#654) @0xGabi
- Revert unwanted change of the default `mnemonic` (#633) @0x6431346e

---

## v6.0.5 - 2019-07-14

### 🐛 Bug Fixes

- Fix yarn installation and update to `web3@1.0.0-beta.37` (#622) @0xGabi

---

## v6.0.4 - 2019-07-07

---

## v6.0.3 - 2019-07-07

---

## v6.0.2 - 2019-07-07

---

## v6.0.1 - 2019-07-06

---

## v6.0.0 - 2019-07-05

### 💥 Breaking changes

- `ipfs` is no longer installed by default, you need to call `aragon ipfs install`.
- `aragon apm publish` now requires confirmation, use the `--skip-confirmation` flag to migrate your scripts or CI configs.

### 🚀 New features

- Make go-ipfs optional (#528) @0x6431346e
  - Introduce three new IPFS commands: `aragon ipfs install`, `aragon ipfs uninstall` and `aragon ipfs status`
- Output publish information before publishing when using `aragon apm publish` (#574) @0xGabi
  - Refactor the whole publish process prompting the user to decide if:
    - Publish the content to aragonPM repo
    - Propagate the content through IPFS (if applicable)
- Sanity check `artifact.json` generation and include the `deprecated` key on `artifact.json`. This new key have the information of the deprecated functions between different contract version published (#426) @0xGabi

### 💡 Feature updates

- Update `dao token new` options to use a deployed `minimeTokenFactory` in Rinkeby and Mainnet as default (#555) @0xGabi
- Refactor artifact generation & improve sanity check (#570) @0xGabi
- New prepublish option for `aragon apm publish` that allow to run a script before publish the app (#571) @0xGabi
- Pass apm opts to @aragon/wrapper (#567) @0x6431346e
- Add a new option `token-factory-address` to `dao token new` (#555) @0xGabi

### 🐛 Bug Fixes

- Fix parsing for booleans, arrays & numbers in several commands (#555) @0xGabi

---

## v5.10.0 - 2019-06-16

### 🚀 New features

- New flag `--apm.ipfs.gateway` used to read APM artifacts from.
  Defaults to `http://localhost:8080/ipfs`, but some defaults environment now point to `https://ipfs.eth.aragon.network/ipfs`, see [environments.default.json](https://github.com/aragon/aragon-cli/blob/master/packages/aragon-cli/config/environments.default.json) (#519)

### 💡 Feature updates

- Update the GUI client to `v0.7.4` (#519)

### 🐛 Bug Fixes

- Fix `Could not create transaction due to missing app artifact` by pinning `@aragon/wrapper` to `v5.0.0-rc.9`, see <https://github.com/aragon/aragon.js/issues/325> (#519)

---

## v5.9.7 - 2019-07-15 (🌳 STABLE)

- This version builds on top of `v5.9.3` and does not include the changes of `v5.9.4`, `v5.9.5`, and
  `v5.9.6` which are included in `v6.x.x`

### 🐛 Bug Fixes

- Fix yarn installation caused by a misplaced dependency

---

## v5.9.6 - 2019-06-12

### 💡 Feature updates

- Change the default ipfs gateway on non-local environments (#455) @0xGabi
- Require artifacts when fetching published repo (#332) @mikec

---

## v5.9.5 - 2019-06-06

---

## v5.9.4 - 2019-06-02

### 💡 Feature updates

- Update `dao install` to always show the proxy address (#478) @fabriziovigevani

### 🐛 Bug Fixes

- Fix an issue with parsing args caused by `yargs@13` (#490) @0xGabi

---

## v5.9.3 - 2019-05-27

### 🐛 Bug Fixes

- Fix `Cannot find any-observable` caused by `lint-staged@8.1.0` (#485) @0xGabi

---

## v5.9.2 - 2019-05-26

### 🐛 Bug Fixes

- Downgrade yargs to v12 because v13 caused `--silent` and `--debug` to not work (#484 ) (Fixed in `v5.10.0`)

---

## v5.9.1 - 2019-05-24

### 🐛 Bug Fixes

- Re-published because `lerna` [screwed up the lock file](https://github.com/aragon/aragon-cli/blob/v5.9.1/docs-internal/Dependencies.md#regenerate-the-lockfiles) when publishing (`async-eventemitter`) making `v5.9.0` uninstallable.

---

## v5.9.0 - 2019-05-24

### 💡 Feature updates

- `aragon apm versions` now accepts a `[apmRepo]` parameter to inspect packages, other than the one in `arapp.json` (#458)
- the APM timeout has been increased to 5 minutes and made configurable in the `package.json` of the CLI (you can tweak it by building from source) (#481)

---

## v5.8.0 - 2019-05-18

## v5.7.2 - 2019-05-18

## v5.7.1 - 2019-05-04

## v5.7.0 - 2019-04-27

## v5.6.2 - 2019-04-17

## v5.6.1 - 2019-03-25

## v5.6.0 - 2019-03-25

## v5.5.0 - 2019-03-12

## v5.4.0 - 2019-02-27

## v5.3.3 - 2019-01-29

## v5.3.2 - 2019-01-18

## v5.3.1 - 2019-01-18

## v5.3.0 - 2019-01-17
