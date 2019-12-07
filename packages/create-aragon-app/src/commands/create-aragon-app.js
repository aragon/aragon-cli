const TaskList = require('listr')
const execa = require('execa')
const inquirer = require('inquirer')
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
//
const defaultAPMName = require('../helpers/default-apm')
const listrOpts = require('../helpers/listr-options')
const { installDeps, isValidAragonId } = require('../util')
const { checkProjectExists, prepareTemplate } = require('../lib')

const templateOptions = {
  bare: {
    repo: 'aragon/aragon-bare-boilerplate',
    name: 'Aragon bare boilerplate',
  },
  react: {
    repo: 'aragon/aragon-react-boilerplate',
    name: 'Aragon React boilerplate',
  },
  tutorial: {
    repo: 'aragon/your-first-aragon-app',
    name: 'Your first Aragon app (tutorial)',
  },
}

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
      description: `The template to scaffold from (${Object.keys(
        templateOptions
      ).join(', ')})`,
      coerce: function resolveTemplateName(tmpl) {
        if (tmpl && !tmpl.includes('/')) {
          if (tmpl === 'react-kit') {
            throw new Error(
              `The 'react-kit' boilerplate has been deprecated and merged with 'react' boilerplate.`
            )
          } else if (!templateOptions[tmpl]) {
            throw new Error(`No template named ${tmpl} exists`)
          }
        }

        return tmpl
      },
    })
}

exports.handler = async function({ reporter, name, template, silent, debug }) {
  name = defaultAPMName(name)
  const basename = name.split('.')[0]

  if (!template && !silent) {
    const { templateChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateChoice',
        message: 'Chose a template to scaffold from',
        choices: Object.entries(templateOptions).map(([id, { name }]) => ({
          name,
          value: id,
        })),
      },
    ])
    template = templateChoice
  } else if (silent) {
    template = 'react'
  }

  const repo = (templateOptions[template] || {}).repo
  if (!repo) throw new Error(`No template repo found for ${template}`)

  const templateUrl = `https://github.com/${repo}`

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
          task.output = `Cloning ${templateUrl} into ${basename}...`
          await clone(templateUrl, basename, { shallow: true })
        },
      },
      {
        title: 'Preparing template',
        task: async (ctx, task) => {
          task.output = 'Initiliazing arapp.json and removing Git repository'
          await prepareTemplate(basename, name)
        },
        enabled: () => !templateUrl.includes('your-first-aragon-app'),
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
    reporter.success(`Created new application ${name} in ${basename}

Start your Aragon app by typing:

  cd ${basename}
  npm start
    
Visit https://hack.aragon.org/docs/cli-main-commands for more information.

`)
  })
}
