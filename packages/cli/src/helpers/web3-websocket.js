const web3WebsocketOptions = {
  timeout: 10000,
  clientConfig: {
    keepalive: false,
    keepaliveInterval: 500,
  },
}

module.exports = {
  web3WebsocketOptions,
}
