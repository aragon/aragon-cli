module.exports = function middlewaresDecorator (middlewares) {
  return function decorate (cmd) {
    cmd.middlewares = middlewares

    return cmd
  }
}
