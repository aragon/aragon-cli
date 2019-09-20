These are general purpose commands that will help you to set up and interact with your development environment.

## aragon run

The `run` command takes care of completely setting up the environment needed for running your Aragon app.

```sh
aragon run
```

These are all the things that running `aragon run` will do for you:

1. It checks whether **IPFS** and a local **Ethereum development chain** (devchain) are running and if not it will start them. Once aragon is terminated, any IPFS or dev chain it started will also be terminated.
2. It will **publish your app** to the local aragonPM registry running in your devchain. This step executes the `aragon apm publish` internally. You can check the options and how the command works in depth [here](cli-apm-commands.md).
3. Once the package is published it will **create a DAO** with your app installed. If you are running your app without a Template it will grant permissions to the first account printed in the console to perform all the actions protected by the ACL in your app.
4. After the DAO is created it will download the [Aragon client](https://github.com/aragon/aragon), install its dependencies and start it up so you can interact with the DAO in your web browser.

Available options to customize the `run` command:

- `--reset`: If reset is present it will reset the devchain before running. The chain will then start from scratch and all published packages will need to be recreated.
- `--port`: The port where the devchain will be started.
- `--network-id`: Network id to connect with.
- `--block-time`: Specify blockTime in seconds for automatic mining.
- `--files`: The path to the files that will be published. Defaults to the current directory.
- `--build`: A flag to specify whether the webapp should be built while publishing, running the script specified in `build-script` of `package.json`. Defaults to `true`.
- `--build-script`: The name of the NPM script in your app that will be used for building the webapp.
- `--prepublish`: A flag to specify whether to run a prepublish script specified in `prepublish-script` of `package.json`. Defaults to `true`.
- `--template`: The name of the contract that will be deployed as the [DAO template](templates-intro.md) that will be used to create your DAO. If no Template is provided it will use a default Template that sets up the DAO with just your app (`bare-template.aragonpm.eth`).
- `--template-init [argument1 ... argumentN]`: The constructor arguments for the Template contract, each separated by a space. See the [deploy command](#aragon-deploy) for more information on constructor arguments.
- `--template-deploy-event`: Arguments to be passed to the template constructor. Defaults to `DeployInstance`.
- `--prepublish-script`: The name of the NPM script in your app that will be run before publishing the app. Defaults to `prepublishOnly`.
- `bump`: Type of bump (major, minor or patch) or version number to publish the app.
- `--client`: Whether to start the Aragon client or not. Defaults to `true`.
- `--client-version`: Version of Aragon client used to run your sandboxed app.
- `--client-repo`: Repository of Aragon client to clone and run in your sandboxed app. Defaults to `https://github.com/aragon/aragon`.
- `--client-port`: Port being used by Aragon client.
- `--client-path`: A path pointing to an existing Aragon client installation.
- `--app-init`: Name of the function that will be called to initialize an app. Defaults to `initialize`.
- `--app-init-args`: Arguments for calling the app init function. To use arrays use the following format `["'0xB24b...73a7', '0xB24b...73a7'"]`.

### Running your app from a development HTTP server

`aragon run` by default will replicate Aragon's production environment and publish your app using IPFS. However, when developing the webapp part of your Aragon app, using IPFS would require you to repeat the entire publishing process every time you make a change and want to try it out.

Using the HTTP mode for running your app requires starting an HTTP server to serve your app files before executing `aragon run` or `aragon apm publish`

```sh
# start your app server before
aragon run --http [server-uri] --http-served-from [path]
```

- `http`: This is the flag that indicates that you wish to run your app using HTTP. The URI of the server must be provided here (e.g. `localhost:4001`)
- `http-served-from`: Path to the directory that the HTTP server exposes. Some artifacts are generated and placed in this directory during the publishing process of your app. The server needs serve these new files when they are created and the server is already running.

If your HTTP server supports hot-reloading your app's frontend will be hot-reloaded inside the Aragon client.

However, when **making changes to the background script** of your app, a refresh of the client is required so the new script can be loaded. Also, depending on how the background script of your app is being built, you may need to manually trigger the compilation of the script.

The [React boilerplate](https://github.com/aragon/aragon-react-boilerplate) supports serving your app using HTTP.

> **Note**<br>
> The `kits` has been deprecated and `templates` should be used instead. You may find the `kits` notation in some places while we make the transition.

## aragon start

Start the Aragon GUI (graphical user interface)

```sh
aragon start [client-version]
```

- `client-version`: Version of Aragon client used to run your sandboxed app (commit hash, branch name or tag name)

Options:

- `--client-port`: Port being used by Aragon client.
- `--client-path`: A path pointing to an existing Aragon client installation.

## aragon devchain

The `devchain` command is used for starting a local development testnet with all the required components already deployed and ready to use.

```sh
aragon devchain
```

It uses [aragen](https://github.com/aragon/aragen) for setting up the snapshot from which the chain starts. At any point `aragon devchain --reset` can be run which will reset the devchain to the original snapshot.

This snapshot contains a local instance of ENS, the first-party [Aragon apps](https://github.com/aragon/aragon-apps) published to aragonPM (e.g. `voting.aragonpm.eth` or `token-manager.aragonpm.eth`) and the first-party [DAO Templates](https://github.com/aragon/dao-kits) (e.g. `bare-template.aragonpm.eth`).

Devchains can be started on different ports and will keep their state independent from other chains.

Options:

- `--reset`: Resets the devchain to the snapshot.
- `--port`: The port number where the devchain will be started.
- `--verbose`: Enable verbose output. Similar to ganache-cli.

> **Note**<br>
> The ENS instance is used both for the aragonPM registry `aragonpm.eth` and for the [aragon-id](https://github.com/aragon/aragon-id) `aragonid.eth`.

### aragon devchain status

Used to check the status of the local devchain.

```sh
aragon devchain status
```

Options:

- `--port`: The port to check. Defaults to `8545`.

## aragon deploy

The `deploy` command can be used for deploying an Ethereum contract to the devchain.

```sh
aragon deploy [contract-name] --init [argument1 ... argumentN]
```

The `contract-name` defaults to the contract at the path in arapp.json.

Running `aragon deploy` will compile your contracts using `truffle compile` and will deploy the contract with the constructor arguments provided.

Options:

- `--init`: Arguments to be passed to contract constructor on deploy. Need to be separated by a space. The `@ARAGON_ENS` alias can be used and it will be replaced by the address of the ENS registry in the devchain.

## aragon contracts

The `aragon contracts` command can be used to execute commands using the same [truffle](https://github.com/trufflesuite/truffle) version that aragonCLI uses behind the scenes to assist in compiling your app's contracts.

```sh
aragon contracts <command>
```

It is equivalent to executing `npx truffle <command>`
