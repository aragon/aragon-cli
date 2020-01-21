#!/usr/bin/env node
require('engine-check')()
const cli = require('./cli').init()
cli.argv // eslint-disable-line no-unused-expressions

