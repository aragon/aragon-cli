# Reviewing

## A pull request created from a fork

Due to preference or push permissions, some contributors create pull requests from a different
remote than `origin`, i.e. a fork. For example: `aragon:master` < `satoshi:feat/add-consensus`.

### Testing locally (read-only)

- Fetch the branch from a PR reference and switch to it:
  
  ```sh
  git fetch origin pull/ID/head:BRANCHNAME
  git checkout BRANCHNAME
  ```

  Where:
  - `ID` is the PR number (e.g.: `5`)
  - `BRANCHNAME` the branch of the PR (e.g.: `feat/add-consensus`)

Note: the remote `refs/pulls` is read-only, you cannot push commits.

### Testing and adding commits

If the pull request creator has [allowed edits from maintaners][allow-edits-docs], and we wish to
add some commits as well, we can proceed like this:

- Add a new remote and switch to a branch tracking it:

  ```sh
  git remote add REMOTE_NAME git@github.com:USER/REPO.git
  git checkout -t REMOTE_NAME/BRANCHNAME
  ```

  Where:
  - `USER` is the GH account (e.g.: `satoshi`)
  - `REPO` the repository (e.g.: `aragon-cli`)
  - `REMOTE_NAME` can be anything, but we recommend it to be the same as `USER`

  Tips:
  - to see the current remotes: `git remote --verbose`
  - to remove a remote: `git remote remove <name>`

- Make changes, commit, and push as usual

[allow-edits-docs]: https://help.github.com/en/articles/allowing-changes-to-a-pull-request-branch-created-from-a-fork#enabling-repository-maintainer-permissions-on-existing-pull-requests
