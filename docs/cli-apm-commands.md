---
id: cli-apm-commands
title: aragonPM commands
sidebar_label: aragonPM commands
---

The `aragon apm` commands are the easiest way to manage aragonPM repositories.

## aragon apm versions

Shows all the previously published versions of your package (defined in `arapp.json`).

```sh
aragon apm versions
```

## aragon apm packages

Lists all the packages in a apm registry.

```sh
aragon apm packages [apmRegistry]
```

- `apmRegistry`: The registry to inspect. Defaults to `aragonpm.eth`.

## aragon apm info

Shows information about a repository.

```sh
aragon apm info <apmRepo> [apmRepoVersion]
```

- `apmRepo`: Name of the APM repo.
- `apmRepoVersion`: Version of the repo. Defaults to `latest`.

## aragon apm grant

Grant an address or a group of addresses the permission to create new versions in your package (defined in `arapp.json`), by interacting directly with the ACL, without performing transaction pathing.

```sh
aragon apm grant [addr1 ... addrN]
```

- `addresses`: The addresses being granted the permission to publish to the repo. 

## aragon apm publish

The `aragon apm publish` command publishes a new version to the aragonPM repo.

```sh
aragon apm publish <bump> [contract]
```

- `bump`: Type of bump (major, minor or patch) or version number.
- `contract`: (optional) The address or name of the contract to publish in this version. If it isn't provided, it will default to the contract specified in the `arapp.json` file.

> **Note**<br>
> Changes to the contract can only be published with a major version bump. Minor and patch versions are only for frontend changes.

If a minor or patch version is being published then the command can be run with the `--only-content` flag which will skip compiling the contracts.

You can target a particular directory to publish, using `--files`. We always publish apps with:

```sh
aragon apm publish <version> --environment <environment> --files app/build
```

The command has the following parameters:

- `--only-content`: For minor and patch upgrades; whether to skip contract compilation, deployment and contract artifact generation.
- `--only-artifacts`: Whether just generate artifacts file without publishing.
- `--provider`: The provider where the files of the package will be published to. Defaults to `ipfs`.
- `--files`: The path to the files that will be published. Defaults to the current directory.
- `--ignore`: A gitignore pattern of files to ignore. Specify multiple times to add multiple patterns. Defaults to just the `node_modules` directory.
- `--publish-dir`: The path to the directory where all the files and generated artifacts will be copied to before publishing. If it is not specified, it will create a temporary directory.
- `--build`: A flag to specify whether the webapp should be built while publishing, running the script specified in `--build-script`. Defaults to `true`.
- `--build-script`: The name of the NPM script in your app that will be used for building the webapp.
- `--http`: The URI for the HTTP server that will be serving your app files (e.g. localhost:1234). See [instructions on running from HTTP](#running-your-app-from-a-development-http-server) for more information.
- `--http-served-from`: Path to the directory that the HTTP server exposes (e.g. ./dist). Some artifacts are generated and placed in this directory during the publishing process of your app.
- `--ipfs-check`: Whether to have start IPFS if not started. Defaults to `true`.
- `--reuse`: Whether to reuse the previous version contract and skip deployment on non-major versions. Defaults to `false`.
