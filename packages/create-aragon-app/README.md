# Create Aragon App

Will set up an Aragon app project so you can start building your app from a functional boilerplate.

## Command

```
create-aragon-app [app-name] [boilerplate]
```

- `app-name`: The name or ENS domain name for your app in an aragonPM Registry (e.g. `myapp` or `myapp.aragonpm.eth`). If only the name is provided it will create your app on the default `aragonpm.eth` registry.

- `boilerplate`: the Github repo name or alias for a boilerplate to set up your app. The currently available boilerplates are:

	- `react`: this boilerplate contains a very basic Counter app and a webapp for interacting with it. It showcases the end-to-end interaction with an Aragon app, from the contracts to the webapp.
	- `react-kit`: it is a variation of the `react` boilerplate that also comes with a DAO Kit which will allow for using your app to interact with other Aragon apps like the Voting app. You can read more about DAO Kits [here](https://github.com/aragon/hack/blob/master/docs/kits-intro.md).
	- `bare`: this boilerplate will just set up your app directory structure but contains no functional code.

## Example

```
npx create-aragon-app myapp
cd myapp
npm start
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

Then open [http://localhost:3000/](http://localhost:3000/) to see your app.<br>
When you’re ready to deploy bundle with `npm run build`.

