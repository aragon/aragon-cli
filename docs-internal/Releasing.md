# Releasing

Terminology for this context:

- Releasing: marking (tagging) a new software version
- Publishing: uploading a new build to the package manager

The tags we use are: `latest`, `stable`, `nightly`.

> By default, `npm install <pkg>` (without any `@<version>` or `@<tag>` specifier) installs the `latest` tag.
>
> By default, other than `latest`, no tag has any special significance to `npm` itself.

## Nightly

TODO: Add release process.

## Stable

Prepare the release notes:

1. Edit the new release draft on GitHub: <https://github.com/aragon/aragon-cli/releases>
   (these are created by [release-drafter](https://github.com/apps/release-drafter))
2. Double check that it correctly summarizes the changes since the last release: <https://github.com/aragon/aragon-cli/commits/master>

## Something went wrong

- Revert the last commit:

```sh
git revert HEAD~ --hard
git push --force
```

- Delete the tags, locally and on the remote, i.e.:

```sh
git tag --delete @aragon/cli@5.9.5 create-aragon-app@2.2.3
git push --delete origin @aragon/cli@5.9.5 create-aragon-app@2.2.3
```

Note: you cannot redeploy the same version to npm, a new version must be used.
(see [npm unpublish docs](https://docs.npmjs.com/cli/unpublish))

## Useful readings

- [npm dist tag docs](https://docs.npmjs.com/cli/dist-tag)
