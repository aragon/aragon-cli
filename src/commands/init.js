const { MessageError } = require('../errors')
const { promisify } = require('util')
const clone = promisify(require('git-clone'))

exports.command = 'init <name> [template]'

exports.describe = 'Initialise a new application'

exports.examples = [
  ['$0 init poll.aragonpm.eth', `Create a new app called "poll.aragonpm.eth" in the directory "poll"`]
]

exports.builder = (yargs) => {
  return yargs.positional('name', {
    description: 'The application name'
  })
    .option('cwd', {
      description: 'The current working directory',
      default: process.cwd()
    })
    .positional('template', {
      description: 'The template to scaffold from',
      default: 'react',
      coerce: function resolveTemplateName (tmpl) {
        const aliases = {
          bare: 'aragon/aragon-bare-boilerplate',
          react: 'aragon/aragon-react-boilerplate'
        }

        if (!tmpl.includes('/')) {
          if (!aliases[tmpl]) {
            throw new MessageError(`No template named ${tmpl} exists`)
          }
          tmpl = aliases[tmpl]
        }

        return `https://github.com/${tmpl}`
      }
    })
    .check(function validateApplicationName ({ name }) {
      const isValidAppName = name.split('.').length >= 2
      if (!isValidAppName) {
        throw new MessageError(`${name} is not a valid application name (should be e.g. "foo.aragonpm.eth")`, 'ERR_INVALID_APP_NAME')
      }

      return true
    })
}

exports.handler = function ({ reporter, name, template }) {
  // Clone the template into the directory
  // TODO: Somehow write name to `manifest.json` in template?
  // TODO: Write human-readable app name to `arapp.json`
  const basename = name.split('.')[0]
  reporter.info(`Cloning ${template} into ${basename}...`)

  return clone(template, basename, { shallow: true })
    .then(() => {
      reporter.success(`Created new application ${name} in ${basename}`)
    })
}
