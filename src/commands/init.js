const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const TaskList = require('listr')
const execa = require('execa')
const fs = require('fs')

exports.command = 'init <name> [template]'

exports.describe = 'Initialise a new application'

exports.builder = (yargs) => {
  return yargs.positional('name', {
    description: 'The application name (appnamehere.aragonpm.eth)'
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
    }, true)
}

exports.handler = function ({ reporter, name, template }) {
  // TODO: Somehow write name to `manifest.json` in template?
  // TODO: Write human-readable app name to `arapp.json`
  const basename = name.split('.')[0]
  const tasks = new TaskList([
    {
      title: 'Clone template',
      task: async (ctx, task) => {
        task.output = `Cloning ${template} into ${basename}...`

        const repo = await clone(template, basename, { shallow: true })
        console.log(`Template cloned to ${basename}`)
        const arapp = JSON.parse(fs.readFileSync(`./${basename}/arapp.json`))
        arapp.appName = arapp.appName.replace('app', basename)
        fs.writeFileSync(`./${basename}/arapp.json`, JSON.stringify(arapp, null, 2))
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
