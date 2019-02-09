## Short-term

🚧 Review new contributions (high priority)

- There are usually 10-15 open PRs going stale which is inefficient because they require plenty of work to update (when there's conflicts) and sometimes they get duplicated like [this](https://github.com/aragon/aragon-cli/pull/254) and [this](https://github.com/aragon/aragon-cli/pull/272)

🚧 [Implement a mono repo structure with `lerna`](https://github.com/aragon/aragon-cli/pull/325) 

🚧 Finish the `aragon start` command [here](https://github.com/aragon/aragon-cli/pull/255/files) which is intended to be more development friendly that `aragon run`, i.e. [doesn't create a new dao every time](https://github.com/aragon/aragon-cli/issues/311), uses http rather than ipfs (to have hot/live reload for the frontends, and maybe something similar for the contracts, a watch → compile loop) 

👾 [E2E tests with sharness](https://github.com/aragon/aragon-cli/issues/358)

👾 Bugfixes, see all [here](https://github.com/aragon/aragon-cli/labels/bug)

- [gasLimit](https://github.com/aragon/aragon-cli/issues/346) issue
- [gas issue on dao acl grant](https://github.com/aragon/aragon-cli/issues/350)
- [dao new fails with ganache 2.3](https://github.com/aragon/aragon-cli/issues/321) (low priority because pinning works alright at the moment)

Note: We should write tests as we fix these to ensure no regressions!

👾 Small features (low hanging fruit)

- remove [hard-coded gas price](https://github.com/aragon/aragon-cli/issues/353) (would be nice to let the user decide how much)

👾 [Claiming an aragonid](https://github.com/aragon/aragon-cli/issues/347) 

👾 Document new features (dao token commands)

👾 Restructure documentation on hack.aragon to include:

- Quick start / Overview / Introduction
- Guides around specific subjects (e.g.: Publish to different environments, Using a different Ethereum account, Propagating content, etc), similar to [this](https://github.com/aragon/aragon-react-boilerplate#publish). Maybe also link more in-depth guides such as [this](https://forum.aragon.org/t/guide-custom-aragon-organization-deployment-using-the-cli/507)
- FAQ section. We have [this](https://hack.aragon.org/docs/cli-usage.html#troubleshooting-faq) currently, but it should be it's own section and much more elaborate (If there is a recurring question on #dev-help we will add it there)

## Long-term

- Types (use Flow or Typescript) because it will allow us to catch more "errors" at compile time, having commands silently fail without noticing (like [this](https://github.com/aragon/aragon-cli/pull/334#discussion_r248659171)) less often. Using Typescript is also great for intellisense support (having auto-completion from IDEs) and refactoring
- Improve smart contract tooling using new Ethereum dev tools from 0x:
    - `[sol-trace](https://sol-trace.com)`: Human-readable stack traces
    - `[sol-coverage](https://sol-coverage.com)`*:* Solidity code coverage
    - `[sol-profiler](https://sol-profiler.com)`: Gas profiling for Solidity
    - `[sol-compiler](https://sol-compiler.com)`: Solidity compilation

    We plan to prioritize `sol-trace` and to look into the benefits that the others tools could have on the developer experience and decide whether to work on that *short-term*.

- Identify contracts like the `MiniMeTokenFactory` which do not need to be deployed every time, but rather reused, and publish them to `aragonpm.eth` (just like the `dao-kits`)

- Wizard onboarding 🧙‍♂️
    - The goal of this tool will be to help new users create a custom DAO
    - "Import" the onboarding of the multisig and democracy kits from the ui client
    - Improve UX for installing "core" apps (e.g.: TokenManager, Voting, etc.), because currently is a bit tricky as you have to check what arguments the `initialize` function takes from the app's contract and pass them with `--app-init-args`, e.g.: `dao install [dao-address] voting --app-init-args 0x00000001 600000000000000000 250000000000000000 604800`. We should do this, instead of the users, so they can see what are the needed parameters with `--help`  or `--interactive`. For example `dao install voting --help` could return `dao install voting [dao-address] [token-address] [support-required] [quorum] [vote-time]`
    - Commands can become interactive (with prompts) using `[yargs-interactive](https://www.npmjs.com/package/yargs-interactive)`

    Example: To create a new MiniMe token, you would use the `dao token new` command, which takes the following arguments `<token-name> <symbol> [decimal-units] [transfer-enabled]`, e.g.: `dao token new "Aragon Network Token" "ANT" 18 true`. Using

    `dao token new --interactive` though, would output this:
    
    ![alt text](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/ba2b8fd3-400b-425e-8d71-59381a0f76d8/Untitled.png?AWSAccessKeyId=ASIAT73L2G45MUQUGMXG&Expires=1549812298&Signature=jzG2sPDgeYcB9Zd9varZlqIRzF4%3D&x-amz-security-token=FQoGZXIvYXdzEB0aDKFd0gNValJVyxjuWSK3Ax0SjqEaNpRBlQtp9%2BSAGi1RNhFEpHI9dkZx%2BJA2%2BgdHr7z4IMAQRGHemmf28rttDLHuyQlvXVmNwF6OLMCl2sYyPsZCjmm2yDw5W8FSighcYlvushqFJKDTWlhMz%2Fzy3heWBDhH59obwLk3gibWiKvbyNkwtEPR2CKOIBQ1CryNgbjxqw9yyhX2JDUkQqQ7JToESHZi3xMKFvpbyS3PoQfchaC9jjZ7weDJ1xh4Db9qu7CEJm8wGohxRcIegtL56O7VUmoCZzNKnDoODZsllIqFS64HOKTOOPOyXfFkf4WDyTNZKpqihJ9xaes4Lv1WujW5rIl5vd0sO%2FPrdWKHdNvze6CbLVsLH%2FabwdM3R8FuYwuR7SQqcDZCDRxVgb7DQzFR%2F0KC%2BURzVPcsLbTp9HQYA4XmDWDYH5uIvTmVZoCVaDEnGSCka7j7Oiv%2FG7ewkv7w0U1lhAkBw%2FEBaRDSqMSyXIeuz%2Be3Qu6k6BZvQBlom%2BHMFGkYpwawkQ7iZ6pxMvmC5UjTIB84XPvmhup2khU1sSbHOSUX6fsp6Xpyqfl%2BbKW5FwbVoIItg6dyY44NykiZDqAVLLko7%2Fv64gU%3D)
    
## Ongoing

- Active on the different dev-related aragon.chat channels. We aim to respond within one day and to allocate ~1 hour each day to debug issues like [this](https://github.com/aragon/aragon-react-kit-boilerplate/issues/19), help people deploy to testnets, etc.
- Aragen maintenance
- Prioritize this roadmap
    - with issues that are blocking users
    - with features needed by flock/nest teams
    - together with the community, by having this document public and by having a "sprint/milestone" every 2 weeks which people can "influence" during the all devs call or directly in GitHub ([aragon-cli#milestones](https://github.com/aragon/aragon-cli/milestones?direction=asc&sort=due_date))

    Note: These documents should be moved to GitHub

[aragonCLI specification](https://www.notion.so/0eda0bfd145b4d15b6aaa874aadf6d97)

[JavaScript project practices](https://www.notion.so/ae5c9f94e9e3432fb31ad9d997962f56)

---

## Legend

🚧 In progress

👾 New issues
