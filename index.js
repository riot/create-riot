#!/usr/bin/env node

// Set options as a parameter, environment variable, or rc file.
// eslint-disable-next-line no-global-assign
require = require('esm')(module) // eslint-disable-line
const createRiotAPI = require('./src/index.js')

if (module.parent) {
  module.exports = createRiotAPI
/* istanbul ignore next */
} else createRiotAPI.default()
