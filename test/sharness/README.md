# aragonCLI-sharness-tests

AragonCLI whole tests using the [Sharness framework](https://github.com/chriscool/sharness/)

## Running all the tests

Just use `make` in this directory to run all the tests.

## Running just one test

You can run only one test script by launching it like a regular shell
script:

```
$ ./sharness.t
```

## Command-line options

The `*.t` test scripts have the following options:

- `--debug`, `-d`: helps debugging
- `--immediate`, `-i`: stop execution after the first failing test
- `--long-tests`, `-l`: run tests marked with prereq EXPENSIVE
- `--interactive-tests`: run tests marked with prereq INTERACTIVE
- `--help`, `-h`: show test description
- `--verbose`, `-v`: show additional debug output
- `--quiet`, `-q`: show less output
- `--chain-lint`/`--no-chain-lint`: check &&-chains in scripts
- `--no-color`: don't color the output
- `--tee`: also write output to a file
- `--verbose-log`: write output to a file, but not on stdout
- `--root=<dir>`: create trash directories in `<dir>` instead of current directory.

## Sharness

When running sharness tests from main Makefile, dependencies for sharness
will be downloaded from its github repo and installed in a "lib/sharness"
directory.

Please do not change anything in the "lib/sharness" directory.

## Writing Tests

Start with the [sharnes API](https://github.com/chriscool/sharness/blob/master/API.md) and then please have a look at existing tests and try to follow their example.

It should be possible to put most of the code inside `test_expect_success`,
or sometimes `test_expect_failure`, blocks, and to chain all the commands
inside those blocks with `&&`, or `||` for diagnostic commands.

### Diagnostics

Make your test case output helpful for when running sharness verbosely.
This means cating certain files, or running diagnostic commands.
For example:

```
test_expect_success ".ipfs/ has been created" '
  test -d ".ipfs" &&
  test -f ".ipfs/config" &&
  test -d ".ipfs/datastore" &&
  test -d ".ipfs/blocks" ||
  test_fsh ls -al .ipfs
'
```

The `|| ...` is a diagnostic run when the preceding command fails.
test*fsh is a shell function that echoes the args, runs the cmd,
and then also fails, making sure the test case fails. (wouldnt want
the diagnostic accidentally returning true and making it \_seem* like
the test case succeeded!).
