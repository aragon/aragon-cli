# Aragon CLI

[![Build Status](https://img.shields.io/travis/aragon/aragon-dev-cli/master.svg?style=flat-square)](https://travis-ci.org/aragon/aragon-dev-cli)
[![Test Coverage](https://img.shields.io/coveralls/aragon/aragon-dev-cli.svg?style=flat-square)](https://coveralls.io/github/aragon/aragon-dev-cli)
[![NPM version](https://img.shields.io/npm/v/@aragon/cli.svg?style=flat-square)](https://npmjs.org/package/@aragon/cli)
[![Downloads](https://img.shields.io/npm/dm/@aragon/cli.svg?style=flat-square)](https://npmjs.org/package/@aragon/cli)

Aragon CLI is a tool for creating, testing and publishing Aragon applications.

## Installation

Install Aragon CLI by running

```bash
npm install -g @aragon/cli
```

## Recipes

### Creating and publishing an application

```bash
aragon-dev-cli init polls.aragonpm.test
cd polls
aragon-dev-cli publish
```

### Publishing a new version

```bash
aragon-dev-cli version minor
aragon-dev-cli publish
```

### Scaffolding from a custom template

```bash
aragon-dev-cli init polls.aragonpm.test username/gh-repo
```
