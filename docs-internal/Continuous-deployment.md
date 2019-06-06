# Continuous Deployment

Having CD configured in an automated way, allows us to:

- make the release task less time-consuming and less prone to human errors
- decrease the attack surface by not needing maintainers to have publish access

## Pipelines

### Nightly

We aim to release to this pipeline as soon as something has been merged, including changes that are
small, experimental or lacking proper tests.

**If you don't mind things breaking from time to time, and you want the latest and shiniest**
**features, then this build is for you!**

**Please try it out and let us know early and often if you find any bugs or regressions! Thanks!**

### Stable

Periodically, after some testing has been done, we mark `nightly` builds as `stable`.
This build is recommended for devs that are just getting started and not familiar with the stack,
as well as devs that value stability over the bleeding-edge features.

## Setup
