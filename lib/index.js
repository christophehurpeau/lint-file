'use strict';

require('./initAppRootPath');
const path = require('path');
const dedent = require('dedent');
const cosmiconfig = require('cosmiconfig');
const debug = require('debug')('lint-file');
const { getConfig, validateConfig } = require('lint-staged/src/getConfig');
const printErrors = require('lint-staged/src/printErrors');
const runFile = require('./runFile');

// Force colors for packages that depend on https://www.npmjs.com/package/supports-color
// but do this only in TTY mode
if (process.stdout.isTTY) {
  // istanbul ignore next
  process.env.FORCE_COLOR = '1';
}

const errConfigNotFound = new Error('Config could not be found');

function resolveConfig(configPath) {
  try {
    return require.resolve(configPath);
  } catch (err) {
    return configPath;
  }
}

function loadConfig(configPath) {
  const explorer = cosmiconfig('lint-staged', {
    searchPlaces: [
      'package.json',
      '.lintstagedrc',
      '.lintstagedrc.json',
      '.lintstagedrc.yaml',
      '.lintstagedrc.yml',
      '.lintstagedrc.js',
      'lint-staged.config.js',
    ],
  });

  return configPath
    ? explorer.load(resolveConfig(configPath))
    : explorer.search();
}

module.exports = function lintFile(
  logger = console,
  configPath,
  files,
  debugMode
) {
  files = files.map((file) => path.resolve(file));
  return loadConfig(configPath)
    .then((result) => {
      if (result == null) throw errConfigNotFound;
      debug(
        'Successfully loaded config from `%s`:\n%O',
        result.filepath,
        result.config
      );
      // result.config is the parsed configuration object
      // result.filepath is the path to the config file that was found
      const config = validateConfig(getConfig(result.config, debugMode));

      Object.keys(config.linters).forEach((linterKey) => {
        config.linters[linterKey] = config.linters[linterKey].filter(
          (item) => item !== 'git add'
        );
      });

      runFile(config, files)
        .then(() => {
          debug('linters were executed successfully!');
          // No errors, exiting with 0
          process.exitCode = 0;
        })
        .catch((error) => {
          // Errors detected, printing and exiting with non-zero
          printErrors(error);
          process.exitCode = 1;
        });
    })
    .catch((err) => {
      if (err === errConfigNotFound) {
        logger.error(`${err.message}.`);
      } else {
        // It was probably a parsing error
        logger.error(dedent`
          Could not parse lint-staged config.
          ${err}
        `);
      }
      logger.error(); // empty line
      // Print helpful message for all errors
      logger.error(dedent`
        Please make sure you have created it correctly.
        See https://github.com/okonet/lint-staged#configuration.
      `);
      process.exitCode = 1;
    });
};
