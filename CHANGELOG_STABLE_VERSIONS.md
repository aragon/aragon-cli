# Changelog

All **notable** changes between stable versions will be documented in this file.

- [Changelog](#Changelog)

  - [v6.3.2(🌳)](#v632)
    - [What’s changed in aragonCLI since `v5.9.7`](#Whats-changed-in-aragonCLI-since-v597)
    - [💥 Breaking changes](#%F0%9F%92%A5-Breaking-changes)
    - [🚀 New features](#%F0%9F%9A%80-New-features)
    - [💡 Feature updates](#%F0%9F%92%A1-Feature-updates)
    - [🐛 Bug Fixes](#%F0%9F%90%9B-Bug-Fixes)
    - [🛠️ Maintenance & internal changes](#%F0%9F%9B%A0%EF%B8%8F-Maintenance--internal-changes)

---

## v6.3.2

Release date: **2019-09-23**
[Compare code changes][v6.3.2]

### What’s changed in aragonCLI since `v5.9.7`

### 💥 Breaking changes

- `ipfs` is no longer installed by default, you need to call `aragon ipfs install`.
- `aragon apm publish` now requires confirmation, use the `--skip-confirmation` flag to migrate your scripts or CI configs.

### 🚀 New features

- Use a pre build of the client instead of building it every time 🚀(#764)
- New Command `aragon id assign` (#707)
- Iterate dao act: add `--eth-value` optional argument (#492)
- Bump `@aragon/aragen` to [v5.0.0](https://github.com/aragon/aragen/releases/tag/v5.0.0).
- New command `devchain status` (#678)
- New flag `--apm.ipfs.gateway` used to read APM artifacts from.
  Defaults to `http://localhost:8080/ipfs`, but some defaults environment now point to `https://ipfs.eth.aragon.network/ipfs`, see [environments.default.json](https://github.com/aragon/aragon-cli/blob/master/packages/aragon-cli/config/environments.default.json) (#519)
- Make go-ipfs optional (#528)
  - Introduce three new IPFS commands: `aragon ipfs install`, `aragon ipfs uninstall` and `aragon ipfs status`
- Output publish information before publishing when using `aragon apm publish` (#574)
  - Refactor the whole publish process prompting the user to decide if:
    - Publish the content to aragonPM repo
    - Propagate the content through IPFS (if applicable)
- Sanity check `artifact.json` generation and include the `deprecated` key on `artifact.json`. This new key have the information of the deprecated functions between different contract version published (#426)
- New option `--prepublish` for `aragon apm publish` to specify whether to run a prepublish script specified in `package.json`. The script if defined with the option `--prepublish-script` (defaults to prepublishOnly) (#571)

### 💡 Feature updates

- Include `templates-args` new option for aragon run (#768)
- Fix dao new command for new templates (#669)
- Add Aragon's default endpoint (#713) @0xGabi
- Check for existing transactionPath in execHandler (#385)
- Avoid coercing number arguments from strings to JS numbers (#687)
- Allow arrays to be passed via `--app-init-args` (#623)
- Use all environment on artifact generation (#646)
- Add `gas-price` global option (#625)
- Update `dao install` to always show the proxy address (#478)
- Update `dao token new` options to use a deployed `minimeTokenFactory` in Rinkeby and Mainnet as default to save gas (#555)
- Pass apm opts to @aragon/wrapper (#567)

### 🐛 Bug Fixes

- Add Aragon's default endpoint (#713)
- Fix http provider publish workflow (#701)
- Handle IPFS not being installed (#696)
- Fix prepare publish function and publish intent argument (#685)
- Update command to not hang after finishing (#674)
- Fix `decorateWithAbi` function to filter by function type (#666)
- Fix prepare files function to handle `--files` correctly (#660)
- Project name validation (#635)
- Fix fetch repo option when publishing only content (#654)
- Revert unwanted change of the default mnemonic (#633)
- Fix `Could not create transaction due to missing app artifact` by pinning `@aragon/wrapper` to `v5.0.0-rc.9`, see <https://github.com/aragon/aragon.js/issues/325> (#519)
- Fix parsing for booleans, arrays & numbers in several commands (#555)
- Require artifacts when fetching published repo during `aragon run` (#332)

### 🛠️ Maintenance & internal changes

- Add isPortTaken function to `@aragon/cli-utils` (#668)
- Refactor `cli-utils` package (#652)
- Set-up code coverage (#493)
- Set-up continuous deployment (#513)
- Set-up some [probot](https://probot.github.io) apps (#517, #518)
- Update aragonCLI Roadmap (#504)

[v6.0.5]: https://github.com/aragon/aragon-cli/compare/v5.9.7...v6.0.5
