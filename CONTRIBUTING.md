# Contributing to aragonCLI

:tada: Thank you for being interested in contributing to an Aragon Project! :tada:

Feel welcome and read the following sections in order to know how to ask questions and how to work on something.

All members of our community are expected to follow our [Code of Conduct](https://wiki.aragon.org/documentation/Code_of_Conduct/). Please make sure you are welcoming and friendly in all of our spaces.

## Get Involved

There are many ways to contribute to Aragon, and many of them do not involve writing any code. Here's a few ideas to get started:

- Does everything work as expected? If not, we're always looking for improvements. Let us know by [opening an issue](#reporting-new-issues).
- Look through the [open issues](https://github.com/aragon/aragon-cli/issues). Provide workarounds, ask for clarification, or suggest labels.
- If you find an issue you would like to fix, [open a pull request](#your-first-code-contribution). Issues tagged as [_Good first issue_](https://github.com/aragon/aragon-cli/issues?q=is%3Aissue+is%3Aopen+label%3A%22%3Apray%3A+good+first+issue%22) are a good place to get started.
- Read through [Aragon documentation](https://hack.aragon.org/docs/cli-intro.html). If you find anything that is confusing or can be improved, you can make edits by clicking "Edit" at the top of most docs.
- Take a look at the [features requested](https://github.com/aragon/aragon-cli/issues?q=is%3Aissue+is%3Aopen+label%3A%22🚀+new+feature%22) by others in the community and consider opening a pull request if you see something you want to work on.

Contributions are very welcome.

## Ways to Contribute

We use [GitHub Issues](https://github.com/aragon/aragon-cli/issues) for our public bugs. If you would like to report a problem, take a look around and see if someone already opened an issue about it. If you a are certain this is a new, unreported bug, you can submit a [bug report](#reporting-new-issues).

You can also file issues as [feature requests or enhancements](https://github.com/aragon/aragon-cli/issues?q=is%3Aissue+is%3Aopen+label%3A%22🚀+new+feature%22). If you see anything you'd like to be implemented, create an issue with [feature template](https://raw.githubusercontent.com/aragon/aragon-cli/master/.github/ISSUE_TEMPLATE/feature.md).

Do your best to include as many details as needed in order for someone else to fix the problem and resolve the issue.

### Reporting new issues

When [opening a new issue](https://github.com/aragon/aragon-cli/issues/new/choose), always make sure to fill out the issue template. **This step is very important!**

- **One issue, one bug:** Please report a single bug per issue.
- **Provide reproduction steps:** List all the steps necessary to reproduce the issue. The person reading your bug report should be able to follow these steps to reproduce your issue with minimal effort.

### Fix an issue

You can browse our [issue tracker](https://github.com/aragon/aragon-cli/issues) and choose an issue to fix. The development process follows one typical of open source contributions. Here's a quick rundown:

1. [Find an issue](https://github.com/aragon/aragon-cli/issues) that you are interested in addressing or a feature that you would like to add.
2. Fork the repository to your local GitHub organization. This means that you will have a copy of the repository under `your-GitHub-username/hack`.
3. Clone the repository to your local machine using `git clone https://github.com/github-username/aragon.js.git`.
4. Create a new branch for your fix using `git checkout -b branch-name-here`.
5. Make the appropriate changes for the issue you are trying to address or the feature that you want to add.
6. Use `git add insert-paths-of-changed-files-here` to add the file contents of the changed files to the "snapshot" git uses to manage the state of the project, also known as the index.
7. Use `git commit -m "Insert a short message of the changes made here"` to store the contents of the index with a descriptive message.
8. Push the changes to the remote repository using `git push origin branch-name-here`.
9. Submit a pull request in github to the upstream repository.
10. Title the pull request with a short description of the changes made and the issue or bug number associated with your change. For example, you can use a title like "Added more log outputting to resolve #4352".
11. In the description of the pull request, explain the changes that you made, any issues you think exist with the pull request you made, and any questions you have for the maintainer. It's OK if your pull request is not perfect (no pull request is). The reviewer will be able to help you fix any problems and improve it!
12. Wait for the pull request to be reviewed by a maintainer.
13. Make changes to the pull request if the maintainer recommends them.
14. Celebrate your success after your pull request is merged by making some noise in the #dev channel! :tada:

## Your First Code Contribution

So you have decided to contribute code back to upstream by opening a pull request. You've invested a good chunk of time, and we appreciate it. We will do our best to work with you and get the PR looked at.

Working on your first Pull Request? You can learn how from this free video series:

[**How to Contribute to an Open Source Project on GitHub**](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)

Unsure where to begin contributing? You can start by looking through these `good first issue` issues:

- [Good first issue](https://github.com/aragon/aragon-cli/labels/%3Apray%3A%20good%20first%20issue) - issues which should only require a few lines of code, and a test or two.

## Getting help

If you need help, please reach out to Aragon core contributors and community members in the [#dev-help channel](https://aragon.chat/channel/dev-help) on the Aragon Chat. We'd love to hear from you and know what you're working on!

## Style Guide

[Prettier](https://prettier.io) and [ESLint](https://eslint.org) will catch most styling and linting issues that may exist in your code.

## Semantic Commit Messages

See how a minor change to your commit message style can make you a better programmer.

Format: `<type>(<scope>): <subject>`

`<scope>` is optional

### Example

```
feat: allow overriding of webpack config
^--^  ^------------^
|     |
|     +-> Summary in present tense.
|
+-------> Type: chore, docs, feat, fix, refactor, style, or test.
```

The various types of commits:

- `feat`: (new feature for the user, not a new feature for build script)
- `fix`: (bug fix for the user, not a fix to a build script)
- `docs`: (changes to the documentation)
- `style`: (formatting, missing semi colons, etc; no production code change)
- `refactor`: (refactoring production code, eg. renaming a variable)
- `test`: (adding missing tests, refactoring tests; no production code change)
- `chore`: (updating grunt tasks etc; no production code change)

### Rules

- Use lower case not title case!
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
