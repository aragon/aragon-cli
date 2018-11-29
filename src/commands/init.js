import { checkProjectExists, prepareTemplate } from '../lib/init'
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const TaskList = require('listr')
const { installDeps } = require('../util')
const defaultAPMName = require('../helpers/default-apm')
const listrOpts = require('../helpers/listr-options')

exports.command = 'init <name> [template]'

exports.describe = 'Initialise a new application'

exports.builder = yargs => {
  return yargs
    .positional('name', {
      description: 'The application name (appname.aragonpm.eth)',
    })
    .option('cwd', {
      description: 'The current working directory',
      default: process.cwd(),
    })
    .positional('template', {
      description: 'The template to scaffold from',
      default: 'react',
      coerce: function resolveTemplateName(tmpl) {
        const aliases = {
          bare: 'aragon/aragon-bare-boilerplate',
          react: 'aragon/aragon-react-boilerplate',
          'react-kit': 'aragon/aragon-react-kit-boilerplate',
        }

        if (!tmpl.includes('/')) {
          if (!aliases[tmpl]) {
            throw new Error(`No template named ${tmpl} exists`)
          }
          tmpl = aliases[tmpl]
        }

        return `https://github.com/${tmpl}`
      },
    })
}

exports.handler = function({ reporter, name, template, silent, debug }) {
  name = defaultAPMName(name)
  const basename = name.split('.')[0]

  const tasks = new TaskList(
    [
      {
        title: 'Preparing initialization',
        task: async (ctx, task) => {
          task.output = 'Checking if project folder already exists...'
          await checkProjectExists(basename)
        },
      },
      {
        title: 'Cloning app template',
        task: async (ctx, task) => {
          task.output = `Cloning ${template} into ${basename}...`
          await clone(template, basename, { shallow: true })
        },
      },
      {
        title: 'Preparing template',
        task: async (ctx, task) => {
          task.output = 'Initiliazing arapp.json and removing Git repository'
          await prepareTemplate(basename, name)
        },
      },
      {
        title: 'Installing package dependencies',
        task: async (ctx, task) => installDeps(basename, task),
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
    .run()
    .then(() =>
      reporter.success(`Created new application ${name} in ${basename}`)
    )
}
