# Testing

<p align="center">
  <img src="/docs/assets/testing-pyramid.png" width="550" height="280">
</p>

## Testing environment

Unit + integration test are included on each package under test folder on root (e.g. [aragon-cli](https://github.com/aragon/aragon-cli/tree/master/packages/aragon-cli/test/)).

We suggest to run unit + integration test before commits.

The notation of tests follow the patter `*.test.js`.

The testing environment consist of the following tools:

1. Structure and syntax -> [AVA framework](https://github.com/avajs/ava)
2. Assertion functions -> [AVA assertions](https://github.com/avajs/ava/blob/master/docs/03-assertions.md)
3. Mocks, spies, and stubs -> [Sinon.JS](https://sinonjs.org)
4. Code coverage -> [Istanbul](https://istanbul.js.org) with [nyc](https://github.com/istanbuljs/nyc) wrapper. We also use [codecov](https://codecov.io/) for adding coverage reporting.

### Running tests

#### Scripts

Each package comes with the following scripts to run unit and integration tests:

```json
{
  "test": "nyc ava",
  "test:watch": "ava --watch"
}
```

**Note:** Use `npm run test:watch` if you want to let them automatically run on change.

#### Snapshots

For some tests we use [snapshot testing](https://github.com/avajs/ava/blob/master/docs/04-snapshot-testing.md), also supported on AVA. They provide us with a way to test how processes affect selected commands. Configured with GitHub Actions allow us to detect new bugs efficiently.

### Integration and Functional Tests on CLI

Writing integration tests to a CLI tool is not as straightforward as it seems, since you're essentially running a process (the test runner) to run another process (the CLI). This involves creating one parent process and a child process. And that also means controlling the input and evaluating the output of your tool, so you can evaluate the output as if you were running the tool directly in a terminal.

It's possible to communicate with the parent process (the test runner) for it to send down information to the child process. Node.js allows you to do exactly that. Under `child_process.spawn API` there’s an option for called [Inter Process Communication (IPC)](https://nodejs.org/api/child_process.html#child_process_options_stdio). When a Node.js process is spawned with this option, global `process.send` and `process.on` methods are created in the child process, enabling an effective pub/sub pattern. To enable IPC in child process you need to configure `options.stdio` equal to `[null, null, null, 'ipc']`.

To solve part of this issue we defined the function [`startProcess`](https://github.com/aragon/aragon-cli/blob/develop/packages/cli/src/lib/node/process.js#L38).

### Debugging

You can use [Node inspector Manager (NiM)](https://chrome.google.com/webstore/detail/nodejs-v8-inspector-manag/gnhhdgbaldcilmgcpfddgdbkhjohddkj?hl=en) and `node --inspect-brk` when running against `dist/cli.js.`
