# cypress-runner

### Serves an app, and runs cypress e2e tests

### Usage:

```
Usage: cypress-runner.js [open|run] [options]

Commands:
  cypress-runner.js open  Open the cypress UI
  cypress-runner.js run   Runs the cypress test suite

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --path     The path to serve files from                      [default: "dist"]
  --port     The port to serve files from                        [default: 4000]

Specify either "open" or "run"
```

### Examples

Run your cypress e2e tests against the SPA located in `dist`:

```
cypress-runner run --path dist
```

Opens the cypress UI to interactively run e2d tests against the SPA located in `dist`:

```
cypress-runner open --path dist
```

