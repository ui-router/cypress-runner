const fs = require('fs');
const { resolve } = require('path');
const waitOn = require('wait-on');
const nodeCleanup = require('node-cleanup');

function findBinary(binaryName, path) {
  const binary = resolve(path, 'node_modules', '.bin', binaryName);
  if (fs.existsSync(binary)) {
    return binary;
  }

  const parent = resolve(path, '..');
  if (parent === path) {
    throw new Error(`Couldn't find **/node_modules/.bin/${binaryName} in parents of ${path.resolve()}`);
  }

  return findBinary(binaryName, parent);
}

function launchCypress(cypressCmd, path, port) {
  if (!fs.existsSync(path)) {
    console.error(`${resolve(path)} doesn't exist, can't serve files`);
    process.exit();
  }

  let serve, cypress;

  const cleanupServe = () => {
    if (serve) {
      console.log('Terminating serve...');
      serve.kill();
    }
    serve = null;
  };

  const cleanupCypress = () => {
    if (cypress) {
      console.log('Terminating cypress...')
      cypress.kill();
    }
    cypress = null;
  };

  const cleanup = () => {
    cleanupServe();
    cleanupCypress();
  }

  const { fork } = require('child_process');
  const serveBinary = findBinary('serve', '.');
  let serveArgs = [ '-n', '-s', '-p', port, path ];

  const cypressBinary = findBinary('cypress', '.');

  console.log(`Launching ${[serveBinary].concat(serveArgs).join(' ')}`);
  serve = fork(serveBinary, serveArgs);

  waitOn({ resources: [`http://localhost:${port}`], window: 500, timeout: 30000}, () => {
    console.log(`detected http service ready on port ${port}`)
    console.log(`Launching ${[cypressBinary].concat(cypressCmd).join(' ')}`);
    cypress = fork(cypressBinary, [ cypressCmd ]);
    cypress.on('exit', (code) => {
      console.log(`Cypress completed with exit code ${code}`);
      cypress = null;
      cleanupServe();
      process.exit(code)
    });
  });

  nodeCleanup((exitCode, signal) => {
    if (signal) {
      console.log(`cypress-runner exiting via signal ${signal}`);
    } else if (exitCode) {
      console.log(`cypress-runner exiting with exit code ${exitCode}`);
    }
    cleanup();
  });

  serve.on('exit', (code) => {
    console.log(`Serve completed with exit code ${code}`);
    serve = null;
    cleanupCypress();
  });
}

module.exports.launchCypress = launchCypress;
