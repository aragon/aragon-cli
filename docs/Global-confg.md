## The arapp.json file

The arapp.json file contains metadata for your app. This are the fields need to be present:

- `roles`: An array of all the roles that your app has. Each role has the following properties:
  - `id`: The identifier of the role as it is defined in the contract.
  - `name`: A description of the role in the app.
  - `params`: The names of any parameters for the role.
- `environments`: An object containing deploy environment configurations.
  - `env_name`: An object containing the configuration for a specific environment. `env_name` can be any name you choose.
    - `appName`: The ENS name of your app where the aragonPM repo can be located.
    - `network`: The network to use for this environment.
    - `wsRPC`: (optional) If present is used by aragon.js as its data provider.
    - `registry`: (optional) The address of the ENS registry for this environment. Defaults to the default ENS registry for this network.
    - `apm`: An object containing apm options.
      - `ipfs`
        - `gateway`: An URI to the IPFS Gateway to read files from. Defaults to `http://localhost:8080/ipfs`.
        - `rpc`: An URI to the IPFS node used to publish files. Defaults to `http://localhost:5001#default`.
- `path`: The path to the main contract in your app.
- `links`: (optional) Array of links. Each object in that array should have name and address attributes. Used to links any linkable contracts into the deploying contract bytecode.

### Example

This is the arapp.json of the app build in the [tutorial](tutorial.md) configure with rinkeby and mainnet environments.

```json
{
  "roles": [
    {
      "id": "INCREMENT_ROLE",
      "name": "Increment the counter",
      "params": []
    },
    {
      "id": "DECREMENT_ROLE",
      "name": "Decrement the counter",
      "params": []
    }
  ],
  "environments": {
    "default": {
      "appName": "foo.aragonpm.eth",
      "network": "development"
    },
    "aragon:rinkeby": {
        "apm": {
          "ipfs": {
            "gateway": "https://ipfs.eth.aragon.network/ipfs"
          }
        },
        "registry": "0x98df287b6c145399aaa709692c8d308357bc085d",
        "wsRPC": "wss://rinkeby.eth.aragon.network/ws",
        "network": "rinkeby"
    },
    "aragon:mainnet": {
        "apm": {
          "ipfs": {
            "gateway": "https://ipfs.eth.aragon.network/ipfs"
          }
        },
        "registry": "0x314159265dd8dbb310642f98f50c066173c1259b",
        "wsRPC": "wss://mainnet.eth.aragon.network/ws",
        "network": "mainnet"
    }
  },
  "path": "contracts/CounterApp.sol",
  "links": [
    {
      "name": "CounterExtension",
      "address": "0x82606d5d2dB55Ac1D36a011dbbA769c729349f56"
    }
  ]
}
```

### How to use environments

If you want to learn how use environments in practice check the guides to learn [how to publish in diferent environments](guides-publish.md).

## The manifest.json file

The manifest.json defines end-user specific configurations:

- `name`: Human-readable name of your app.
- `description`: Small description of the app.
- `icons`: (optional) An array of all the icons that your app has. Each icon has the following properties:
  - `src`: Path to the icon's image.
  - `sizes`: Size of the icon.
- `script`: (optional) Background script path.
- `start_url`: Path to the starting URL.
