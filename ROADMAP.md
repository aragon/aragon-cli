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

As part of the ongoing process we would like to experiment with create new documentation for:

<details><summary>aragonCLI specification</summary>
   
# Goals

- It's clear what are the use cases for every command/package
- Identifying the common building blocks that are reused throughout the CLI commands

    ( `aclExecHandler.js`, `execHandler.js`, `aragonjs-wrapper.js`, `ipfs.js`, etc.)

    - These should be heavily tested, documented and their relationships simplified as much as possible or at least documented (as they can run very deep, e.g.:  `acl grant -> aclExecHandler -> execHandler -> initAragonJS`)
- Prevent the removal of critical features that are heavily dependent on (by distinguishing them from temporary hacks, workarounds, etc.)
- It's possible to implement the CLI in another language (Go, Rust, etc.) by following this document as opposed to reading the source code of the JS implementation.
- The intended behavior of certain features is obvious, therefore fixing bugs/refactoring much faster.

# Example

The `aragon ipfs` command consists of the following steps:

1. Start IPFS
    1. If no custom `ipfs.rpc` is passed, should use the default [`http://localhost:5001`](http://localhost:5001/#default)
        1. If it's not already running, it should be started
        2. Should set CORS every time 
    2. If a custom `ipfs.rpc` is passed, it should only check CORS, not change it and throw if it's not set up correctly 
2. Add local files
    1. Should add local files from `aragen/ipfs-cache` ignoring `node_module` directories

There are a couple of things that are not clear from reading the source code:

- Should the files from `ipfs-cache` be added to the "remote" node (`apmOptions.ipfs.rpc`)? What happens if that fails? Should it first check if the files are there and if not throw an error/warning?

    Currently the CLI will try to connect to `[localhost:5001](http://localhost:5001)` even if `apmOptions.ipfs.rpc` is provided and has CORS configured, see [here](https://github.com/aragon/aragon-cli/blob/master/src/commands/ipfs.js#L47)

- What is the rationale for `ignore: 'node_modules'`? Could this be instead done when generating the `ipfs-cache`?
</details>

<details><summary>JavaScript project practices</summary>

# Goals

This document encompasses common, ***opinionated*** practices for maintaining JS projects. The goal of this document could be to become an [AIP](https://github.com/aragon/AIPs/) standard (?) ([see AIP-1](https://docs.google.com/document/d/1-qrVNSWtZD3TwusRL-ZkVeDRAukjGCfveR0RYfzNb8c/edit#heading=h.9qzbemw7to41)) and serve as a starting point for keeping projects healthy across the Aragon ecosystem: 

- Libraries such as `aragon.js`, `aragonUI`, etc.
- CLI tools such as `aragonCLI`, `@pando/cli`, etc.
- Aragon apps such as `aragon-react-boilerplate`, `voting`, `aragon-drive`, etc.

## Any JS projects should have

- [Linting and code style](https://gist.github.com/0x6431346e/a8beb62c854ee3c8816a3a2ba20bfcda) ✔️
    - Use `ESLint`, `TSLint`, `prettier` and `standard`
- Contributing guide & Pull Request practices ✔️
    - Squash and rebase
- Issue templates
    - `aragon/aragon` already has some [here](https://github.com/aragon/aragon/tree/master/.github/ISSUE_TEMPLATE)

        (ideally they should not differ too much)

- Testing
    - Unit testing with `ava` ✔️
        - Tests should ran on push with `husky` ✔️
    - Code coverage with `coveralls`
- CI & CD
    - Continuous deployment to NPM using GitHub actions
- Display better error messages
    - Error codes would be useful
    - Create a full list under hack#aragonCLI with all of them, similar to [this](https://docs.microsoft.com/en-us/windows/desktop/debug/system-error-codes)

        (some might be better suited for the aragonAPI)

    - Some places it's needed: [here](https://github.com/aragon/aragon-cli/issues/309), [here](https://github.com/aragon/aragon-cli/issues/308) and [here](https://github.com/aragon/aragon-cli/issues/310)
- Documentation
    - If the docs live in multiple places (e.g. GitHub, hack.aragon.org, etc.), a [pull script](https://github.com/aragon/hack/blob/master/website/scripts/sync-aragonjs-docs.js) can be used
    - The API Reference often can be generated from JSDoc using a tool like `documentation.js`, [like in aragonAPI](https://github.com/aragon/aragon.js/blob/master/packages/aragon-client/package.json#L11)

## CLI tools should have

- Testing
    - E2E testing with `sharness`
    - Human-readable stack traces with `sol-trace`
</details> 

---

## Legend

🚧 In progress

👾 New issues

✔️  Implemented in `aragonCLI`
