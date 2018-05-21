const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const TaskList = require('listr')
const execa = require('execa')
const path = require('path')
const fs = require('fs-extra')
const { installDeps } = require('../util')
const defaultAPMName = require('../helpers/default-apm')

exports.command = 'init <name> [template]'

exports.describe = 'Initialise a new application'

exports.builder = (yargs) => {
  return yargs
    .positional('name', {
      description: 'The application name (appname.aragonpm.eth)'
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
}

exports.handler = function ({ reporter, name, template }) {
  name = defaultAPMName(name)
  
  const basename = name.split('.')[0]
  const tasks = new TaskList([
    {
      title: 'Clone template',
      task: async (ctx, task) => {
        task.output = `Cloning ${template} into ${basename}...`

        const repo = await clone(template, basename, { shallow: true })
        console.log(`Template cloned to ${basename}`)
      }
    },
    {
      title: 'Preparing template',
      task: async (ctx, task) => {
        // Set `appName` in arapp
        const arappPath = path.resolve(
          basename,
          'arapp.json'
        )
        const arapp = await fs.readJson(arappPath)
        arapp.appName = name

        // Delete .git folder
        const gitFolderPath = path.resolve(
          basename,
          '.git'
        )

        return Promise.all([
          fs.writeJson(arappPath, arapp, { spaces: 2 }),
          fs.remove(gitFolderPath)
        ])
      }
    },
    {
      title: 'Install package dependencies',
      task: async (ctx, task) => (await installDeps(basename, task)),
    }
  ])

  return tasks.run()
    .then(() => reporter.success(`Created new application ${name} in ${basename}`))
}
