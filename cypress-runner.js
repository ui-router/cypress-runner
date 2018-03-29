const fs = require('fs');
const { resolve } = require('path');

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

  const { fork } = require('child_process');
  const serveBinary = findBinary('serve', '.');
  const cypressBinary = findBinary('cypress', '.');
  const browserSync = fork(serveBinary, [ '-n', '-s', '-p', port, path ]);
  const cypress = fork(cypressBinary, [ cypressCmd ]);

  process.on('SIGINT', function () {
    browserSync.kill();
    cypress.kill();
  });

  browserSync.on('exit', () => cypress.kill());
  cypress.on('exit', (code) => {
    browserSync.kill();
    process.exit(code)
  });
}

module.exports.launchCypress = launchCypress;
