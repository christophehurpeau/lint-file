'use strict';

process.env.APP_ROOT_PATH = process.cwd();

const dedent = require('dedent');
const cosmiconfig = require('cosmiconfig');
const debug = require('debug')('lint-file');
const { getConfig, validateConfig } = require('lint-staged/src/getConfig');
const printErrors = require('lint-staged/src/printErrors');
const runFile = require('./runFile');

const errConfigNotFound = new Error('Config could not be found');

module.exports = function lintFile(logger = console, configPath, files, debugMode) {
  const explorer = cosmiconfig('lint-staged', {
    configPath,
    rc: '.lintstagedrc',
    rcExtensions: true,
  });

  return explorer
    .load()
    .then(result => {
      if (result == null) throw errConfigNotFound;
      debug('Successfully loaded config from `%s`:\n%O', result.filepath, result.config);
      // result.config is the parsed configuration object
      // result.filepath is the path to the config file that was found
      const config = validateConfig(getConfig(result.config, debugMode));

      runFile(config, files)
        .then(() => {
          debug('linters were executed successfully!');
          // No errors, exiting with 0
          process.exitCode = 0;
        })
        .catch(error => {
          // Errors detected, printing and exiting with non-zero
          printErrors(error);
          process.exitCode = 1;
        });
    })
    .catch(err => {
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
