# Create Aragon App

Toolkit for accessing aragonCLI utilities programmatically.

## Install (local)

```sh
npm install @aragon/toolkit
npm run build
```

## Examples

Import the toolkit in your project:

```js
import { newDAO, getInstalledApps /*etc*/ } from '@aragon/toolkit'
```

Please visit the examples folder for further details on how to use the toolkit in your projects.

# Tests

In the root of the repository, run:

```sh
npm run pretest
```

And then in packages/toolkit, run:

```sh
npm test
```

To test only one file, try:

```sh
npm test -- <path to test file>
```
