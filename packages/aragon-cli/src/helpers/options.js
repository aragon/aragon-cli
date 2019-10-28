const options = {
  BUILD: {
    name: 'build',
    data: {
      description:
        'Whether publish should try to build the app before publishing, running the script specified in --build-script',
      default: true,
      boolean: true,
    },
  },
  BUILD_SCRIPT: {
    name: 'build-script',
    data: {
      description: 'The npm script that will be run when building the app',
      default: 'build',
    },
  },
  PREPUBLISH: {
    name: 'prepublish',
    data: {
      description:
        'Whether publish should run prepublish script specified in --prepublish-script before publishing',
      default: true,
      boolean: true,
    },
  },
  PREPUBLISH_SCRIPT: {
    name: 'prepublish-script',
    data: {
      description: 'The npm script that will be run before publishing the app',
      default: 'prepublishOnly',
    },
  },
  FILES: {
    name: 'files',
    data: {
      description:
        'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
      default: ['.'],
      array: true,
    },
  },
  BUMP: {
    name: 'bump',
    data: {
      description:
        'Type of bump (major, minor or patch) or version number to publish the app',
      type: 'string',
      default: 'major',
    },
  },
  PUBLISH_DIR: {
    name: 'publish-dir',
    data: {
      description:
        'Temporary directory where files will be copied before publishing. Defaults to temp dir.',
      default: null,
    },
  },
  HTTP: {
    name: 'http',
    data: {
      description: 'URL for where your app is served from e.g. localhost:1234',
      default: null,
      coerce: url => {
        return url && url.substr(0, 7) !== 'http://' ? `http://${url}` : url
      },
    },
  },
  HTTP_SERVED_FROM: {
    name: 'http-served-from',
    data: {
      description:
        'Directory where your files is being served from e.g. ./dist',
      default: null,
    },
  },
}

const addOption = (command, option, isPositional = false) => {
  if (!option) {
    throw new Error('Unrecognized option')
  }

  if (isPositional) {
    command.positional(option.name, option.data)
  } else {
    command.option(option.name, option.data)
  }
}

module.exports = {
  options,
  addOption,
}
