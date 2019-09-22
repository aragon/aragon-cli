# Changelog

All changes to this project will be documented in this file.

- [Changelog](#Changelog)
- [v6.4.0](#v640)
  - [What’s changed in aragonCLI](#Whats-changed-in-aragonCLI)
  - [💡 Feature updates](#%F0%9F%92%A1-Feature-updates)
  - [🛠️ Maintenance (non-API changes)](#%F0%9F%9B%A0%EF%B8%8F-Maintenance-non-API-changes)
- [v6.3.1](#v631)
- [v6.3.0](#v630)
- [v6.2.6](#v626)
- [v6.2.5](#v625)
- [v6.2.4](#v624)
- [v6.2.3](#v623)
- [v6.2.2](#v622)
- [v6.2.1](#v621)
- [v6.2.0](#v620)
- [v6.1.1](#v611)
- [v6.1.0](#v610)
- [v6.0.5](#v605)
- [v6.0.4](#v604)
- [v6.0.3](#v603)
- [v6.0.2](#v602)
- [v6.0.1](#v601)
- [v6.0.0](#v600)
- [v5.10.0](#v5100)
- [v5.9.7](#v597)
- [v5.9.6](#v596)
- [v5.9.5](#v595)
- [v5.9.4](#v594)
- [v5.9.3](#v593)
- [v5.9.2](#v592)
- [v5.9.1](#v591)
- [v5.9.0](#v590)
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

## v6.4.0

Release date: **2019-09-20**  
[Compare code changes][v6.4.0] (🌳 STABLE)

## 💡 Feature updates

- Iterate `aragon run`: add `--client-repo` optional argument

## 🛠️ Maintenance (non-API changes)

- Add deploy event compatibility

---

## v6.3.1

Release date: **2019-09-16**  
[Compare code changes][v6.3.1]

### What’s changed in aragonCLI

## 🐛 Bug Fixes

- Backward compatibility fix for the old deploy event name and the publish folder (#778) @macor161

---

## v6.3.0

Release date: **2019-09-13**  
[Compare code changes][v6.3.0]

### What’s changed in aragonCLI

## 💡 Feature updates

- Update client to 0.8 🛣 (#765) @0xGabi
- Include `templates-args` new option (#768) @0xGabi
- Use a pre build of the client instead of building it every time 🚀(#764) @0xGabi
- Use new aragen snapshot (#772) @0xGabi

## 🐛 Bug Fixes

- Fix deployment with new Templates (#762) @0xGabi

## 🛠️ Maintenance (non-API changes)

- Added more dependencies (#759) @chrishobcroft 🎉
- Dao new clean (#772) @0xGabi
- Use travis only on mater (#766) @0xGabi
- Update default ipfs distribution installed (#763) @0xGabi

---

## v6.2.6

### What’s changed in aragonCLI

## 💡 Feature updates

- Fix dao new command for new templates (#669) @0xGabi
- Fix output for aragon run & fix http publish flag (#752) @0xGabi

## 🐛 Bug Fixes

- Check IPFS & install if missing (#734) @0xGabi
- Bump aragen to [v5.2.0](https://github.com/aragon/aragen/releases/tag/v5.2.0) , fix tx pathing issue with ganache version (#753) @0xGabi

## 🛠️ Maintenance (non-API changes)

- End to end tests fix (#746) @macor161
- Rollback to truffle-config v4 (#745) @0xGabi

---

## v6.2.5

Release date: **2019-08-18**  
[Compare code changes][v6.2.5]

### What’s changed in aragonCLI

### 🚀 New Feature

- New Command `aragon id assign` (#707) @macor161 🙏

### 🐛 Bug Fixes

- Add Aragon's default endpoint (#713) @0xGabi

### 🛠️ Maintenance (non-API changes)

- Bump `aragen v5.1.0` (#720) @0xGabi

---

## v6.2.4

Release date: **2019-08-08**  
[Compare code changes][v6.2.4]

### What’s changed in aragonCLI

## 💡 Feature updates

- Improve ipfs handler (#701) @0xGabi

## 🐛 Bug Fixes

- Fix http provider publish workflow (#701) @0xGabi

## 🛠️ Maintenance (non-API changes)

- Doc: Improve IPFS section (#699) @0xGabi
- Update changelog (#698) @0xGabi

---

## v6.2.3

Release date: **2019-08-07**  
[Compare code changes][v6.2.3] (🌳 STABLE)

### What’s changed in aragonCLI

## 🚀 New features

- Iterate dao act: add `--eth-value` optional argument (#492) @0xGabi

## 💡 Feature updates

- Check for existing transactionPath in execHandler (#385) @mikec 🎉
- CLI: avoid coercing number arguments from strings to JS numbers (#687) @sohkai 🎉

## 🐛 Bug Fixes

- Handle IPFS not being installed (#696) @0x6431346e

## 🛠️ Maintenance (non-API changes)

- Update FRAME_ORIGIN AragonCLI -> aragonCLI (#688) @john-light 🎉
- Update documentation (#697) @0xGabi
- Bump web3 from 1.2.0 to 1.2.1 (#695) @dependabot-preview
- Bump sinon from 7.3.2 to 7.4.1 (#692) @dependabot-preview
- Bump web3-utils from 1.2.0 to 1.2.1 (#693) @dependabot-preview

---

## v6.2.2

Release date: **2019-08-05**  
[Compare code changes][v6.2.2]

### What’s changed in aragonCLI

## 💡 Feature updates

- Update aragen & client (#686) @0xGabi

---

## v6.2.1

Release date: **2019-08-05**  
[Compare code changes][v6.2.1]

### What’s changed in aragonCLI

## 🐛 Bug Fixes

- Fix prepare publish function and publish intent argument (#685) @0xGabi

## 🛠️ Maintenance (non-API changes)

- Update README & CHANGELOG files (#681) @0xGabi

---

## v6.2.0

Release date: **2019-08-01**  
[Compare code changes][v6.2.0]

### What’s changed in aragonCLI

### 🚀 New features

- Bump `@aragon/aragen` to [v5.0.0](https://github.com/aragon/aragen/releases/tag/v5.0.0).
- New command `devchain status` (#678) @0xGabi

### 💡 Feature updates

- Allow arrays to be passed via `--app-init-args` (#623) @mikec 🎉

### 🐛 Bug Fixes

- Update command to not hang after finishing (#674) @0xGabi
- Fix `decorateWithAbi` function to filter by function type (#666) @0xGabi
- Fix prepare files function to handle `--files` correctly (#660) @0xGabi

### 🛠️ Maintenance (non-API changes)

- Publish (#679) @0xGabi
- Add isPortTaken function to @aragon/cli-utils (#668) @0xGabi
- Bump husky from 3.0.1 to 3.0.2 (#673) @dependabot-preview
- Bump ipfs-http-client from 33.1.0 to 33.1.1 (#670) @dependabot-preview
- [Security] Bump fstream from 1.0.11 to 1.0.12 (#663) @dependabot-preview
- Bump truffle-hdwallet-provider from 1.0.14 to 1.0.15 (#664) @dependabot-preview
- Bump lint-staged from 9.2.0 to 9.2.1 (#661) @dependabot-preview

---

## v6.1.1

Release date: **2019-07-24**  
[Compare code changes][v6.1.1]

### What’s changed in aragonCLI

## 🛠️ Maintenance (non-API changes)

- Small cleanup (#657) @0xGabi

---

## v6.1.0

Release date: **2019-07-23**  
[Compare code changes][v6.1.0]

### What’s changed in aragonCLI

### 💡 Feature updates

- Ipfs cmd refactor (#636) @0x6431346e
- Use all environment on artifact generation (#646) @0xGabi
- Add `gas-price` global option (#625) @0xGabi

### 🐛 Bug Fixes

- Project name validation (#635) @macor161 🎉
- Fix fetch repo option when publishing only content (#654) @0xGabi
- Revert unwanted change of the default mnemonic (#633) @0x6431346e

### 🛠️ Maintenance (non-API changes)

- Release v6.1.0 (#655) @0xGabi
- Bump eslint from 6.0.1 to 6.1.0 (#653) @dependabot-preview
- Refactor cli-utils package (#652) @0xGabi
- [Security] Bump tar from 2.2.1 to 2.2.2 (#647) @dependabot-preview
- Bump eslint-plugin-import from 2.18.0 to 2.18.1 (#649) @dependabot-preview
- Bump husky from 3.0.0 to 3.0.1 (#648) @dependabot-preview
- Bump @babel/node from 7.5.0 to 7.5.5 (#644) @dependabot-preview
- Bump @babel/cli from 7.5.0 to 7.5.5 (#642) @dependabot-preview
- Bump @babel/register from 7.4.4 to 7.5.5 (#641) @dependabot-preview
- Bump documentation from 12.0.1 to 12.0.2 (#630) @dependabot-preview
- Bump @babel/plugin-proposal-object-rest-spread from 7.5.4 to 7.5.5 (#638) @dependabot-preview
- Bump yargs from 13.2.4 to 13.3.0 (#629) @dependabot-preview
- Bump ajv from 6.10.1 to 6.10.2 (#626) @dependabot-preview
- Update changelogs & readmes (#628) @0x6431346e

---

## v6.0.5

Release date: **2019-07-14**  
[Compare code changes][v6.0.5]

### What’s changed in aragonCLI

### 🐛 Bug Fixes

- Fix yarn installation and update to `web3@1.0.0-beta.37` (#622) @0xGabi

## 🛠️ Maintenance (non-API changes)

- Update changelogs (#598) @0x6431346e
- Patch release (#624) @0xGabi
- Bump @aragon/os from 4.2.0 to 4.2.1 (#616) @dependabot-preview
- Bump ipfs-http-client from 33.0.1 to 33.1.0 (#618) @dependabot-preview
- Bump truffle-hdwallet-provider from 1.0.13 to 1.0.14 (#621) @dependabot-preview
- Bump ipfs-http-client from 32.0.1 to 33.0.1 (#613) @dependabot-preview
- Bump lint-staged from 9.1.0 to 9.2.0 (#614) @dependabot-preview
- Bump inquirer from 6.4.1 to 6.5.0 (#612) @dependabot-preview
- Bump documentation from 12.0.0 to 12.0.1 (#610) @dependabot-preview
- Bump @babel/preset-env from 7.5.2 to 7.5.4 (#607) @dependabot-preview
- Bump lodash.merge from 4.6.1 to 4.6.2 (#608) @dependabot-preview
- Bump documentation from 11.0.1 to 12.0.0 (#605) @dependabot-preview
- Bump @babel/core from 7.5.0 to 7.5.4 (#606) @dependabot-preview
- Bump eslint from 5.16.0 to 6.0.1 (#558) @dependabot-preview
- Bump @babel/plugin-proposal-object-rest-spread from 7.5.1 to 7.5.4 (#603) @dependabot-preview
- Bump eslint-config-prettier from 5.1.0 to 6.0.0 (#596) @dependabot-preview
- Bump lint-staged from 8.2.1 to 9.1.0 (#597) @dependabot-preview
- Bump ava from 2.1.0 to 2.2.0 (#599) @dependabot-preview
- Bump @babel/preset-env from 7.5.0 to 7.5.2 (#601) @dependabot-preview

---

## v6.0.4

Release date: **2019-07-07**  
[Compare code changes][v6.0.4]

### What’s changed in aragonCLI

- No code changes (this is a new release to fix a broken deployment)

---

## v6.0.3

Release date: **2019-07-07**  
[Compare code changes][v6.0.3]

### What’s changed in aragonCLI

### 🛠️ Maintenance (non-API changes)

- Improve deploy logs & update releasing document (#592)

---

## v6.0.2

Release date: **2019-07-07**  
[Compare code changes][v6.0.2]

### What’s changed in aragonCLI

### 🛠️ Maintenance (non-API changes)

- Update lockfiles (#591)
- Rename `create-lockfiles` script to `convert-lockfiles` (#591)
- Update CHANGELOG.md (#589)

---

## v6.0.1

Release date: **2019-07-06**  
[Compare code changes][v6.0.1]

### What’s changed in aragonCLI

### 🛠️ Maintenance (non-API changes)

- Update aragonCLI Roadmap (#504) @0xGabi
- Bump eslint-plugin-import from 2.17.3 to 2.18.0 (#556) @dependabot-preview
- Bump husky from 2.4.1 to 3.0.0 (#575) @dependabot-preview
- Bump truffle-hdwallet-provider from 1.0.10 to 1.0.13 (#577) @dependabot-preview
- Bump semver from 6.1.1 to 6.2.0 (#576) @dependabot-preview
- Add pre-requisites section (#559) @chrishobcroft

---

## v6.0.0

Release date: **2019-07-05**  
[Compare code changes][v6.0.0]

### What’s changed in aragonCLI

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

### 🛠️ Maintenance (non-API changes)

- Include documentation about links (#543) @0xGabi
- Update apm docs (#525) @0x6431346e
- Add appveyor.yml (#562) @0xGabi
- Fix e2e test setup (#545) @0xGabi
- Fix lockfiles (#550) @0x6431346e
- Update dependencies (#526) @0x6431346e
- Add CHANGELOG.md (#523) @0x6431346e

---

## v5.10.0

Release date: **2019-06-16**  
[Compare code changes][v5.10.0]

### What’s changed in aragonCLI

### 🚀 New features

- New flag `--apm.ipfs.gateway` used to read APM artifacts from.
  Defaults to `http://localhost:8080/ipfs`, but some defaults environment now point to `https://ipfs.eth.aragon.network/ipfs`, see [environments.default.json](https://github.com/aragon/aragon-cli/blob/master/packages/aragon-cli/config/environments.default.json) (#519)

### 💡 Feature updates

- Update the GUI client to `v0.7.4` (#519)

### 🐛 Bug Fixes

- Fix `Could not create transaction due to missing app artifact` by pinning `@aragon/wrapper` to `v5.0.0-rc.9`, see <https://github.com/aragon/aragon.js/issues/325> (#519)

### 🛠️ Maintenance & internal changes

- Add the `strict` option to yargs so the aragonCLI will not error if an argument is wrongly typed or if a command does not exist (#519)
- Fix the `--silent` and `--debug` flag that broke in `v5.9.6` when updating to `yargs@13` (#519)
- Set-up some [probot](https://probot.github.io) apps (#517, #518)

---

## v5.9.7

Release date: **2019-07-15**  
[Compare code changes][v5.9.7] (🌳 STABLE)

### What’s changed in aragonCLI

- This version builds on top of `v5.9.3` and does not include the changes of `v5.9.4`, `v5.9.5`, and
  `v5.9.6` which are included in `v6.x.x`

### 🐛 Bug Fixes

- Fix yarn installation caused by a misplaced dependency

---

## v5.9.6

Release date: **2019-06-12**  
[Compare code changes][v5.9.6]

### What’s changed in aragonCLI

### 💡 Feature updates

- Change the default ipfs gateway on non-local environments (#455) @0xGabi
- Require artifacts when fetching published repo (#332) @mikec

### 🛠️ Maintenance & internal changes

- Update to yargs 13 (#510) @0xGabi
- Add the `funded💰` label (#502) @0xGabi
- Update CONTRIBUTING.md with Bounties section 🦅 (#507) @0xGabi

---

## v5.9.5

Release date: **2019-06-06**  
[Compare code changes][v5.9.5]

### What’s changed in aragonCLI

### 🛠️ Maintenance & internal changes

- Add code coverage (#493) @0x6431346e
- Set-up continuous deployment (#513) @0x6431346e

---

## v5.9.4

Release date: **2019-06-02**  
[Compare code changes][v5.9.4]

### What’s changed in aragonCLI

### 💡 Feature updates

- Update `dao install` to always show the proxy address (#478) @fabriziovigevani

### 🐛 Bug Fixes

- Fix an issue with parsing args caused by `yargs@13` (#490) @0xGabi

---

## v5.9.3

Release date: **2019-05-27**  
[Compare code changes][v5.9.3]

### What’s changed in aragonCLI

### 🐛 Bug Fixes

- Fix `Cannot find any-observable` caused by `lint-staged@8.1.0` (#485) @0xGabi

---

## v5.9.2

Release date: **2019-05-26**  
[Compare code changes][v5.9.2]

### What’s changed in aragonCLI

### 🐛 Bug Fixes

- Downgrade yargs to v12 because v13 caused `--silent` and `--debug` to not work (#484 ) (Fixed in `v5.10.0`)

---

## v5.9.1

Release date: **2019-05-24**  
[Compare code changes][v5.9.1]

### What’s changed in aragonCLI

### 🐛 Bug Fixes

- Re-published because `lerna` [screwed up the lock file](https://github.com/aragon/aragon-cli/blob/v5.9.1/docs-internal/Dependencies.md#regenerate-the-lockfiles) when publishing (`async-eventemitter`) making `v5.9.0` uninstallable.

---

## v5.9.0

Release date: **2019-05-24**  
[Compare code changes][v5.9.0]

### What’s changed in aragonCLI

### 💡 Feature updates

- `aragon apm versions` now accepts a `[apmRepo]` parameter to inspect packages, other than the one in `arapp.json` (#458)
- the APM timeout has been increased to 5 minutes and made configurable in the `package.json` of the CLI (you can tweak it by building from source) (#481)

### 🛠️ Maintenance & internal changes

- Update dependencies (#483)
- Add shrinkwrap files (#483)
- `aragon run` now has an end-to-end test (#483)

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

[v6.0.4]: https://github.com/aragon/aragon-cli/compare/v6.0.3...v6.0.4
[v6.0.3]: https://github.com/aragon/aragon-cli/compare/v6.0.2...v6.0.3
[v6.0.2]: https://github.com/aragon/aragon-cli/compare/v6.0.1...v6.0.2
[v6.0.1]: https://github.com/aragon/aragon-cli/compare/v6.0.0...v6.0.1
[v6.0.0]: https://github.com/aragon/aragon-cli/compare/v5.10.0...v6.0.0
[v5.10.0]: https://github.com/aragon/aragon-cli/compare/v5.9.6...v5.10.0
[v5.9.7]: https://github.com/aragon/aragon-cli/compare/v5.9.3...v5.9.7
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
