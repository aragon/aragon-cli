# Dependencies

## Dependabot

We have setup [dependabot][dependabot-home] to take care of updating dependencies to their latest
versions.

## Lock files

We are using [npm shrinkwrap][shrinkwrap-home] for the reasons described [here][shrinkwrap-issue].

### Regenerate the lockfiles

Example:

```sh
npm run delete-shrinkwraps
npm run clean
npm install # this will call bootstrap too
npm run create-shrinkwraps
```

## Out of date dependencies

To check outdated dependencies:

```sh
npm outdated
```

## Tips

- To pin a dependency:

```sh
npm install --save-exact web3@1.0.0-beta.34
```

- To downgrade a dependency:

```sh
npm install --save ignore@4
```

- To upgrade a dependency:

```sh
npm install --save ignore@latest
```

Note: sometimes you need to [regenerate the lockfiles](#regenerate-the-lockfiles) when you install
a new package, because the automatic updates prove very unreliable.

[dependabot-home]: https://dependabot.com/
[shrinkwrap-home]: https://docs.npmjs.com/cli/shrinkwrap.html
