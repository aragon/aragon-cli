import { checkProjectExists, prepareTemplate } from '../lib'
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const TaskList = require('listr')
const { installDeps, isValidAragonId } = require('../util')
const defaultAPMName = require('../helpers/default-apm')
const listrOpts = require('../helpers/listr-options')
const execa = require('execa')

exports.command = '* <name> [template]'

exports.describe = 'Create a new aragon application'

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
          tutorial: 'aragon/your-first-aragon-app',
        }

        if (!tmpl.includes('/')) {
          if (tmpl === 'react-kit') {
            throw new Error(
              `The 'react-kit' boilerplate has been deprecated and merged with 'react' boilerplate.`
            )
          } else if (!aliases[tmpl]) {
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
          if (!isValidAragonId(basename)) {
            throw new Error(
              reporter.error(
                'Invalid project name. Please only use lowercase alphanumeric and hyphen characters.'
              )
            )
          }

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
        enabled: () => !template.includes('your-first-aragon-app'),
      },
      {
        title: 'Installing package dependencies',
        task: async (ctx, task) => installDeps(basename, task),
      },
      {
        title: 'Check IPFS',
        task: async (ctx, task) => {
          try {
            ctx.ipfsMissing = false
            await execa('ipfs', ['version'])
          } catch {
            ctx.ipfsMissing = true
          }
        },
      },
      {
        title: 'Installing IPFS',
        enabled: ctx => ctx.ipfsMissing,
        task: async (ctx, task) => {
          await execa('npx', [
            'aragon',
            'ipfs',
            'install',
            '--skip-confirmation',
          ])
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks.run().then(() => {
    reporter.success(`Created new application ${name} in ${basename}.`)
  })
}
