#!/usr/bin/env node

const fs = require('fs');
const { resolve }  = require('path');
const yargs = require('yargs')
    .usage('Usage: $0 [open|run] [options]')
    .command('open', 'Open the cypress UI')
    .command('run', 'Runs the cypress test suite')
    .demandCommand(1, 'Specify either "open" or "run"')
    .option('path', {
      description: 'The path to serve files from',
      default: 'dist',
    })
    .option('port', {
      description: 'The port to serve files from',
      default: 4000,
    }).argv;

const { path, port } = yargs;
const [ cypressCmd ] = yargs._;

if (!fs.existsSync(path)) {
  console.error(`${resolve(path)} doesn't exist, can't serve files`);
  process.exit();
}

const { fork } = require('child_process');
const browserSync = fork('./node_modules/.bin/serve', ['-n', '-s', '-p', port, path]);
const cypress = fork('./node_modules/.bin/cypress', [cypressCmd]);

process.on('SIGINT', function() {
  browserSync.kill();
  cypress.kill();
});

browserSync.on('exit', () => cypress.kill());
cypress.on('exit', (code) => { browserSync.kill(); process.exit(code) });
