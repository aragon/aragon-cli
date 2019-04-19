The `aragon ipfs` commands can be used to start an IPFS node configured to pin the core Aragon components, inspect hashes, and propagate files to other nodes.

## aragon ipfs

Shortcut for `aragon ipfs start`

```sh
aragon ipfs
```

## aragon ipfs start

Start an IPFS daemon configured to work with Aragon.

```sh
aragon ipfs start
```

## ipfs propagate

Request the content and its links at several gateways, making the files more distributed within the network.

```sh
ipfs propagate <cid>
```

- `cid`: A self-describing content-addressed identifier

## ipfs view

Display metadata about the content, such as size, links, etc.

```sh
ipfs propagate <cid>
```

- `cid`: A self-describing content-addressed identifier
