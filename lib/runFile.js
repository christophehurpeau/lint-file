'use strict';

const Listr = require('listr');
const runScript = require('lint-staged/src/runScript');
const generateTasks = require('lint-staged/src/generateTasks');
const debug = require('debug')('lint-file:run');

/**
 * Executes all tasks and either resolves or rejects the promise
 * @param config {Object}
 * @param files {String[]}
 * @returns {Promise}
 */
module.exports = function runFile(config, files) {
  debug('Running linter scripts on files: %s', files);

  const { concurrent, renderer } = config;

  const tasks = generateTasks(config, files).map(task => ({
    title: `Running tasks for ${task.pattern}`,
    task: () =>
      new Listr(runScript(task.commands, task.fileList, config), {
        // In sub-tasks we don't want to run concurrently
        // and we want to abort on errors
        dateFormat: false,
        concurrent: false,
        exitOnError: true,
      }),
    skip: () => {
      if (task.fileList.length === 0) {
        return `No files match ${task.pattern}`;
      }
      return false;
    },
  }));

  if (tasks.length) {
    return new Listr(tasks, {
      dateFormat: false,
      concurrent,
      renderer,
      exitOnError: !concurrent, // Wait for all errors when running concurrently
    }).run();
  }
  return 'No tasks to run.';
};
