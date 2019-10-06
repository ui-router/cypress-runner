const fs = require('fs');
const { resolve } = require('path');
const portfinder = require('portfinder');
const waitOn = require('wait-on');
const nodeCleanup = require('node-cleanup');
const { fork } = require('child_process');

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

const log = (message) => console.log(`cypress-runner: ${message}`);
const error = (message) => console.log(`cypress-runner: ${message}`)

function launchCypress(cypressCmd, path, desiredPort, nospa) {
  if (!fs.existsSync(path)) {
    error(`${resolve(path)} doesn't exist, can't serve files`);
    process.exit(-1);
  }

  let serve_process, cypress_process;

  const cleanupServe = () => {
    if (serve_process) {
      log('Terminating serve...');
      serve_process.kill();
    }
    serve_process = null;
  };

  const cleanupCypress = () => {
    if (cypress_process) {
      log('Terminating cypress...')
      cypress_process.kill();
    }
    cypress_process = null;
  };

  const cleanup = () => {
    cleanupServe();
    cleanupCypress();
  };

  portfinder.basePort = desiredPort;
  portfinder.getPort((err, port) => {
    if (err) {
      error(err);
      process.exit(-1);
    }

    const baseUrl = `http://localhost:${port}`;

    const serveBinary = findBinary('serve', '.');
    const serveArgs = [ '-n', nospa ? null : '-s', '-p', port, path ].filter(x => !!x);

    const cypressBinary = findBinary('cypress', '.');
    const cypressArgs = [cypressCmd];
    const cypressEnv = { CYPRESS_baseUrl: baseUrl };

    log(`Launching ${[serveBinary].concat(serveArgs).join(' ')}`);
    serve_process = fork(serveBinary, serveArgs);

    waitOn({ resources: [baseUrl], window: 500, timeout: 30000}, () => {
      log(`Detected serve is ready on port ${port}`)
      log(`Launching CYPRESS_baseUrl=${baseUrl} ${[cypressBinary].concat(cypressArgs).join(' ')}`);

      cypress_process = fork(cypressBinary, [ cypressCmd ], { env: cypressEnv});
      cypress_process.on('exit', (code) => {
        log(`Cypress completed with exit code ${code}`);
        cypress_process = null;
        cleanupServe();
        process.exit(code)
      });
    });

    nodeCleanup((exitCode, signal) => {
      if (signal) {
        log(`exiting via signal ${signal}`);
      } else if (exitCode) {
        log(`exiting with exit code ${exitCode}`);
      }
      cleanup();
    });

    serve_process.on('exit', (code) => {
      log(`Serve completed with exit code ${code}`);
      serve_process = null;
      cleanupCypress();
    });
  })
}

module.exports.launchCypress = launchCypress;
