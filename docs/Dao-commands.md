The `aragon dao` commands can be used for interacting with your DAO directly from the command line. These commands are also available directly using the `dao` alias.

## dao new

Uses a DAO Template to create a new DAO and prints its address.

```sh
dao new
```

Options:

- `--template`: The aragonPM repo name of the template that is used to create the DAO. Defaults to `bare-template.aragonpm.eth`.
- `--template-version [version-number|latest]`: The version of the repo that will be used to create the DAO. Defaults to `latest`.
- `--fn`: The function on the template that is called to create a new DAO. Defaults to the `newBareInstance` function for `bare-template.aragonpm.eth`.
- `--fn-args`: The arguments that the function to create the template is called with. Defaults to an array of arguments.
- `--deploy-event`: The name of the event that is emitted when the DAO is created. The DAO address must be a return argument in the event log named `dao`. Defaults to `DeployInstance`.
- `--ipfs-check`: Whether to have start IPFS if not started. Defaults to `true`.

> **Note**<br>
> The `kits` has been deprecated and `templates` should be used instead. You may find the `kits` notation in some places while we make the transition.

## dao apps

Used to inspect all the installed apps in a DAO.

```sh
dao apps <dao-addr>
```

- `dao-addr`: The main address of the DAO (Kernel).

Options:

- `--all`: To include apps without permissions in the report.

## dao install

The `dao install` command installs an instance of an app in the DAO.

```sh
dao install <dao-addr> <app-apm-repo> [repo-version]
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-apm-repo`: The repo name of the app being installed (e.g. `voting` or `voting.aragonpm.eth`).
- `repo-version`: (optional) Version of the repo that will be installed; can be a version number or `latest` for the newest published version. Defaults to `latest`.

In [aragonOS](/docs/aragonos-ref.html#app-installation) an app is considered to be installed in a DAO if it uses the DAO Kernel as its Kernel and there are references to the app in the ACL of the DAO.

The `dao install` command will create an instance of the app and assign permissions to the main account to perform all the protected actions in the app.

Options:

- `--app-init`: Name of the function that will be called to initialize an app. If you want to skip app initialization (which is not generally recommended), you can do it by set it to `none`. By default it will initialize the app using `initialize` function.
- `--app-init-args`: Arguments for calling the app init function.
- `--set-permissions`: Whether to set permissions in the app. Set it to `open` to allow `ANY_ENTITY` on all roles.

> **Note**<br>
> All app instances of the same app in a DAO must run the same version, so installing an app with a version will effectively upgrade all app instances to this version.

## dao upgrade

The `dao upgrade` command upgrades all instances of an app to a newer version.

```sh
dao upgrade <dao-addr> <app-apm-repo> [repo-version]
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-apm-repo`: The repo name of the app being upgraded (e.g. `voting` or `voting.aragonpm.eth`).
- `repo-version`: Version of the repo that the app will be upgraded to; can be a version number or `latest` for the newest published version (defaults to `latest`).

aragonOS protects against having different instances of a particular app running with different versions (e.g. all the Voting app instances run the same version). Performing a `dao upgrade` will upgrade all instances of the app to the version specified.

## dao exec

Performs transactions in your DAO directly from aragonCLI. It supports [transaction pathing](forwarding-intro.md) so if your account cannot perform the action directly it will try to find how to do it (e.g. creating a vote).

```sh
dao exec <dao-addr> <app-proxy-addr> <method> [argument1 ... argumentN]
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-proxy-addr`: The address of the app where the action is being performed. You can find the proxy address by checking [`dao apps`](#dao-apps).
- `method`: Name of the method being executed in the app (e.g. `withdrawTokens`).
- `arguments`: The arguments that the method will be executed with (each separated by a space).

## dao act

Provides some syntax sugar over `dao exec` for executing actions using [Agent app](https://blog.aragon.one/aragon-agent-beta-release/) instances in a DAO.

```sh
dao act <agent-proxy> <target-addr> <method> [argument1 ... argumentN]
```

- `agent-proxy`: Address of the Agent app proxy.
- `target-addr`: Address where the action is being executed.
- `method`: The [full signature](https://www.4byte.directory) of the method we wish to execute in either the external contract or the app we specified, note that by the full signature we mean the [human readable function signature](https://solidity.readthedocs.io/en/v0.5.3/abi-spec.html#function-selector) (e.g. `vote(unint256,bool,bool)`).
- `arguments`: The arguments that the method will be executed with (each separated by a space).

Options:

- `--eth-value`: Amount of ETH from the contract that is sent with the action.

## dao token

Commands used to create and interact with the tokens your DAO will use.

### dao token new

Create a new [MiniMe](https://github.com/Giveth/minime) token.

```sh
dao token new <token-name> <symbol> [decimal-units] [transfer-enabled] [token-factory-address]
```

- `token-name`: Full name of the new Token.
- `symbol`: Symbol of the new Token.
- `decimal-units`: Total decimal units the new token will use. Defaults to `18`.
- `transfer-enabled`: Whether the new token will have transfers enabled. Defaults to `true`.
- `token-factory-address`: Address of a MiniMe Token Factory deployed on the network. Defaults to an existing Minime Factory address for Rinkeby and Mainnet. Defaults to `0xA29EF584c389c67178aE9152aC9C543f9156E2B3` on Mainnet and `0xad991658443c56b3dE2D7d7f5d8C68F339aEef29` on Rinkeby.

### dao token change-controller

Change the controller of a MiniMe token.

```sh
dao token change-controller <token-addr> <new-controller-addr>
```

- `token-addr`: Address of the token.
- `new-controller-addr`: Address of the new controller.

## dao acl

Used to inspect the ACL state in a DAO to check its permissions.

```sh
dao acl <dao-addr>
```

- `dao-addr`: The main address of the DAO (Kernel).

### dao acl create

Used to create a permission in the ACL. Can only be used if the permission hasn't been created before. The `manager` of the permission can use `dao acl grant` and `dao acl revoke` to manage the permission.

```sh
dao acl create <dao-addr> <app-proxy-addr> <role> <entity> <manager>
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-proxy-addr`: The address of the app whose permissions are being managed. You can find the proxy address by checking [`dao apps`](#dao-apps).
- `role`: The identifier for the role. Can be the `bytes32` identifier of the role or its name (e.g. `INCREMENT_ROLE`).
- `entity`: The address of the entity that is being granted the permission by creating it.
- `manager`: The address of the entity that will be able to grant that permission or revoke it.

### dao acl grant

Used to grant a permission in the ACL.

```sh
dao acl grant <dao-addr> <app-proxy-addr> <role> <entity>
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-proxy-addr`: The address of the app whose permissions are being managed. You can find the proxy address by checking [`dao apps`](#dao-apps).
- `role`: The identifier for the role. Can be the `bytes32` identifier of the role or its name (e.g. `INCREMENT_ROLE`).
- `entity`: The address of entity that is being granted the permission.

### dao acl revoke

Used to revoke a permission in the ACL.

```sh
dao acl revoke <dao-addr> <app-proxy-addr> <role> <entity>
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-proxy-addr`: The address of the app whose permissions are being managed. You can find the proxy address by checking [`dao apps`](#dao-apps).
- `role`: The identifier for the role. Can be the `bytes32` identifier of the role or its name (e.g. `INCREMENT_ROLE`).
- `entity`: The address of entity that is being revoked the permission.

### dao acl set-manager

Used to change the manager of a permission in the ACL.

```sh
dao acl set-manager <dao-addr> <app-proxy-addr> <role> <manager>
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-proxy-addr`: The address of the app whose permissions are being managed. You can find the proxy address by checking [`dao apps`](#dao-apps).
- `role`: The identifier for the role. Can be the `bytes32` identifier of the role or its name (e.g. `INCREMENT_ROLE`).
- `manager`: The new manager for the permission.

### dao acl remove-manager

Used to remove the manager of a permission in the ACL. The permission can be created again after removing its manager.

```sh
dao acl remove-manager <dao-addr> <app-proxy-addr> <role>
```

- `dao-addr`: The main address of the DAO (Kernel).
- `app-proxy-addr`: The address of the app whose permissions are being managed. You can find the proxy address by checking [`dao apps`](#dao-apps).
- `role`: The identifier for the role. Can be the `bytes32` identifier of the role or its name (e.g. `INCREMENT_ROLE`).
