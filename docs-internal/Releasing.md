# Releasing

Terminology for this context:

- Releasing: marking (tagging) a new software version
- Publishing: uploading a new build to the package manager
- Deploying: same as publishing

The act of making a new release is a manual step, as we need to assess whether we should bump a new
major, minor or patch. (see [semver docs](https://semver.org/))

## Nightly

Before releasing let's make sure we are including the latest changes by updating the local branch:

1. `git checkout master`
2. `git pull`
3. `git checkout release/***` (where *** is the next next tag of the `@aragon/cli` package, e.g.: `v6.0.0`)

Prepare the release notes:

1. Edit the new release draft on GitHub: <https://github.com/aragon/aragon-cli/releases>
   (these are created by [release-drafter](https://github.com/apps/release-drafter))
2. Double check that it correctly summarizes the changes since the last release: <https://github.com/aragon/aragon-cli/commits/master>

## Release all packages that have been updated

1. Run `npm run version` and bump the versions according to the release summary.
2. On GitHub Releases, choose the project-wide tag (`@aragon/cli`'s version) and publish.
3. Wait for the CD agent to finish the automatic deployment. (see [`Continuous-deployment.md`](/docs-internal/Continuous-deployment.md))
4. Make some noise on the `#dev` channel.

## Distribution tags

The tags we use are: `latest`, `stable`, `nightly`.

> By default, `npm install <pkg>` (without any `@<version>` or `@<tag>` specifier) installs the `latest` tag.
>
> By default, other than `latest`, no tag has any special significance to `npm` itself.

To mark a `nightly` build as latest stable:

```sh
npm dist-tag add @aragon/cli@6.0.0 stable
npm dist-tag add @aragon/cli@6.0.0 latest
```

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
