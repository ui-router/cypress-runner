#!/usr/bin/env node

const { launchCypress } = require('./cypress-runner');
const yargs = require('yargs')
    .usage('Usage: $0 [open|run] [options]')
    .command('open', 'Open the cypress UI')
    .command('run', 'Runs the cypress test suite')
    .demandCommand(1, 'Specify either "open" or "run"')
    .option('path', {
      description: 'The path to serve files from',
      default: 'dist',
    })
    .option('nospa', {
      description: 'Do not serve /index.html on 404s',
    })
    .option('port', {
      description: 'The port to serve files from',
      default: 4000,
    }).argv;

const { path, port, nospa } = yargs;
const [ cypressCmd ] = yargs._;

launchCypress(cypressCmd, path, port, nospa);
