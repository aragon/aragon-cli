The `aragon ipfs` commands can be used to start an IPFS node configured to pin the core Aragon components, inspect hashes, and propagate files to other nodes.

## aragon ipfs

Shortcut for `aragon ipfs start`.

```sh
aragon ipfs
```

## aragon ipfs start

Start the IPFS daemon and configure it to work with Aragon.

```sh
aragon ipfs start
```

## aragon ipfs status

Status of the IPFS installation & daemon.

```sh
aragon ipfs status
```

Options:

- `--repo-path`: The location of the IPFS repository

## aragon ipfs install

Download and install the go-ipfs binaries.

```sh
aragon ipfs install
```

Options:

- `--dist-version`: The version of IPFS that will be installed. Defaults to `0.4.18-hacky2`.
- `--dist-url`: The url from which to download IPFS. Defaults to `https://dist.ipfs.io`.
- `--local`: Whether to install IPFS as a project dependency. Defaults `false`.
- `--skip-confirmation`: Whether to skip the confirmation step. Defaults to `false`.

## aragon ipfs uninstall

Uninstall the go-ipfs binaries.

```sh
aragon ipfs uninstall
```

Options:

- `--local`: Whether to uninstall IPFS from the project dependencies. Defaults `false`.
- `--skip-confirmation`: Whether to skip the confirmation step. Defaults to `false`.

## aragon ipfs propagate

Request the content and its links at several gateways, making the files more distributed within the network.

```sh
aragon ipfs propagate <cid>
```

Positionals:

- `cid`: A self-describing content-addressed identifier

## aragon ipfs view

Display metadata about the content, such as size, links, etc.

```sh
aragon ipfs view <cid>
```

Positionals:

- `cid`: A self-describing content-addressed identifier
