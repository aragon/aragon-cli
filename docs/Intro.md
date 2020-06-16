![aragonCLI logo](/docs/assets/brand/aragoncli.png)

The aragonCLI (Command Line Interface) is used to create, develop, configure and manage Aragon DAOs and Applications.

## Installation

### Installation pre-requisites

The following must be installed prior to installation:

- Node + npm

  - Version of Node we recommend to be [the latest LTS version, available to download here](https://nodejs.org/en/).
  - After downloading and unpacking, you must add the /bin folder to you \$PATH.

For Linux:

- git
  - Install this using the command `sudo apt install git`
- python
  - Install this using the command `sudo apt install python`
- make
  - Install this using the command `sudo apt install make`
- g++
  - Install this using the command `sudo apt install g++`

For Mac:

- git
  - Install this using the [official installer](http://sourceforge.net/projects/git-osx-installer/). We recommend using the package manager [Homebrew](https://brew.sh), in this case use the command `brew install git`.

Note: Python comes pre-installed on Mac.

For Windows:

- windows-build-tools
  - Install with `npm i windows-build-tools`

### Install aragonCLI

The aragonCLI can be installed from NPM:

```sh
npm install -g @aragon/cli
```

It can also be built and installed from source:

```sh
git clone https://github.com/aragon/aragon-cli.git
cd packages/aragon-cli
npm install
npm link
```

After installing, the main `aragon` executable will be available for use. It will also install the `dao` alias which is a shortcut for `aragon dao` commands.

#### The ~/.aragon directory

The aragonCLI creates the `.aragon` directory under the user directory where it saves the state of the devchain and the [Aragon client](client.md).

In case the client is not loading properly, deleting the `~/.aragon` directory will make `aragon run` recreate the environment the next time it is used and may solve the issue.

#### Set a private key

> **⚠️ Warning**<br>
> The default mnemonic for the Aragon CLI is the same for all users. If you are going to deploy contracts to public networks it is highly recommended that you use your own web3 provider and set your own private key.

You can configure a private key for the Aragon CLI in `~/.aragon`. To do so you will need to create a file `<network>_key.json` (eg. `rinkeby_key.json`) with this structure:

```json
{
  "rpc": "https://<network>.infura.io",
  "keys": ["put-your-priv-key-here"]
}
```

Then if you use `--environment aragon:<network>` when using the aragonCLI it will use that account.

You can also define an `~/.aragon/mnemonic.json` file like:

```json
{
  "mnemonic": "explain tackle mirror kit ..."
}
```

#### Install IPFS

Since `v6.0.0` we separate the instalation of `go-ipfs` from the aragonCLI. If you do not have it installed globally on your system we have a couple of comands to help with that:`aragon ipfs install` and `aragon ipfs uninstall`.

## Global options

Options that change the behaviour of the command:

- `--environment`: The environment in your `arapp.json` that you want to use. Defaults to `aragon:local`. Check the other [default environments](/docs/cli-global-confg.html#example). You can also use it with the `--env` alias.
- `--gas-price`: Gas price in Gwei. Defaults to `2`.
- `--use-frame`: Use Frame as a signing provider and web3 provider.
- `--ens-registry`: Address of the ENS registry. This will be overwritten if the selected environment from your arapp.json includes a `registry` property.
- `--pfs-gateway`: An URI to the IPFS Gateway to read files from. Defaults to `http://localhost:8080/ipfs`.
- `--ipfs-rpc`: An URI to the IPFS node used to publish files. Defaults to `http://localhost:5001#default`.
- `--cwd`: Project working directory.
- `--debug`: Show more output to terminal.
- `--silent`: Silence output to terminal.

### Example

```sh
aragon <command> --environment aragon:mainnet --gas-price 1 --use-frame --debug
```

## create-aragon-app

This command will set up an Aragon app project so you can start building your app from a functional boilerplate.

```sh
npx create-aragon-app <app-name> [boilerplate]
```

- `app-name`: The name or ENS domain name for your app in an aragonPM Registry (e.g. `myapp` or `myapp.aragonpm.eth`). If only the name is provided it will create your app on the default `aragonpm.eth` registry.

- `boilerplate`: (optional) the Github repo name or alias for a boilerplate to set up your app. The currently available boilerplates are:
  - `react`: this boilerplate contains a very basic Counter app and a webapp for interacting with it. It showcases the end-to-end interaction with an Aragon app, from the contracts to the webapp. Also comes with a DAO Template which will allow for using your app to interact with other Aragon apps like the Voting app. You can read more about DAO Template [here](templates-intro.md).
  - `bare`: this boilerplate will just set up your app directory structure but contains no functional code.
  - `tutorial`: this boilerplate is the one used in Your first Aragon app guide.

> **Note**<br>
> This is an independent package, it's not necessary to have `@aragon/cli` installed to use it.
> [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+. If you use npm 5.1 or earlier, you can't use `npx`. Instead, install `create-aragon-app` globally.
