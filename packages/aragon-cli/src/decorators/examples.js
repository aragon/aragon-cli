module.exports = function examplesDecorator (cmd) {
  if (cmd.examples) {
    const _builder = cmd.builder
    cmd.builder = (yargs) => {
      const builder = _builder(yargs)
      cmd.examples.forEach((example) =>
        builder.example(...example))

      return yargs
    }
  }

  return cmd
}
