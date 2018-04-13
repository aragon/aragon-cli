const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const TaskList = require('listr')
const execa = require('execa')

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
            throw new Error(`No template named ${tmpl} exists`)
          }
          tmpl = aliases[tmpl]
        }

        return `https://github.com/${tmpl}`
      }
    })
    .check(function validateApplicationName ({ name }) {
      const isValidAppName = name.split('.').length >= 2
      if (!isValidAppName) {
        throw new Error(`${name} is not a valid application name (should be e.g. "foo.aragonpm.eth")`)
      }

      return true
    })
}

exports.handler = function ({ reporter, name, template }) {
  // TODO: Somehow write name to `manifest.json` in template?
  // TODO: Write human-readable app name to `arapp.json`
  const basename = name.split('.')[0]
  const tasks = new TaskList([
    {
      title: 'Clone template',
      task: (ctx, task) => {
        task.output = `Cloning ${template} into ${basename}...`

        return clone(template, basename, { shallow: true })
          .then(() => `Template cloned to ${basename}`)
          .catch((err) => {
            throw new Error(`Failed to clone template ${template} (${err.message})`)
          })
      }
    },
    {
      title: 'Install package dependencies with Yarn',
      task: (ctx, task) => execa('yarn', { cwd: basename })
        .catch(() => {
          ctx.yarn = false

          task.skip('Yarn not available, install it via `npm install -g yarn`')
        })
    },
    {
      title: 'Install package dependencies with npm',
      enabled: ctx => ctx.yarn === false,
      task: () => execa('npm', ['install'], { cwd: basename })
        .catch(() => {
          throw new Error('Could not install dependencies')
        })
    }
  ])

  return tasks.run()
    .then(() => reporter.success(`Created new application ${name} in ${basename}`))
}
