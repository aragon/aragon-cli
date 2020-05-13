# Dependencies

## Package manager

[Yarn](https://yarnpkg.com) is preferred over npm for local development of aragonCLI.

## Dependabot

We have setup [dependabot][dependabot-home] to take care of updating dependencies to their latest
versions.

## Lock files

We are using yarn.lock and auto-generated [npm shrinkwrap files][https://docs.npmjs.com/cli/shrinkwrap.html].


## Out of date dependencies

To check outdated dependencies:

```sh
yarn outdated
```


## Tips

- To pin a dependency:

```sh
yarn add --exact web3@1.0.0-beta.34
```

- To downgrade a dependency:

```sh
yarn add ignore@4
```

- To upgrade a dependency:

```sh
yarn add ignore@latest
```
