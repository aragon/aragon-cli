# Create Aragon App

Will set up an Aragon app project so you can start building your app from a functional boilerplate.

## Command

```sh
create-aragon-app <app-name> [boilerplate]
```

- `app-name`: The name or ENS domain name for your app in an aragonPM Registry (e.g. `myapp` or `myapp.aragonpm.eth`). If only the name is provided it will create your app on the default `aragonpm.eth` registry.

- `boilerplate`: the Github repo name or alias for a boilerplate to set up your app. The currently available boilerplates are:

  - `react`: this boilerplate contains a very basic Counter app and a webapp for interacting with it. It showcases the end-to-end interaction with an Aragon app, from the contracts to the webapp.
  - `bare`: this boilerplate will just set up your app directory structure but contains no functional code.

## Example

```sh
npx create-aragon-app myapp
cd myapp
npm start
```

Once finished, this will open [http://localhost:3000/](http://localhost:3000/) in your default browser.

_Note: [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher. If you use npm 5.1 or earlier, you can't use `npx`. Instead, install `create-aragon-app` globally._

# Tests

In the root of the repository, run:

```sh
npm run pretest
```

And then in packages/create-aragon-app, run:

```sh
npm test
```

To test only one file, try:

```sh
npm test -- <path to test file>
```

## Local environment

Some commands like `aragon run` depend on a local dev environment (ipfs, ganache).

We set up this up during the `pretest` hook & tear it down during the `posttest` hook.

Pretest:

- Start IPFS
- Start Ganache
- Create a test app

Posttest:

- Stop IPFS
- Stop Ganache
- Delete the test app

**Tip**: Did a test fail and the local environment was cleaned up? Try `npm run test:clean`.
