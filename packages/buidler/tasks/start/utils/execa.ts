import execa from 'execa';

/**
 * Note: This file should be split up as it grows
 * TODO: We shouldn't encourage monolithic utils files. Every util should be its own file.
 */

/**
 * execa wrapper that pipes stdout and stderr to the parent process
 */
export function execaPipe(
  file: string,
  args?: readonly string[],
  options?: execa.Options
): execa.ExecaChildProcess {
  const subprocess: execa.ExecaChildProcess = execa(file, args, options);
  if (subprocess.stdout) subprocess.stdout.pipe(process.stdout);
  if (subprocess.stderr) subprocess.stderr.pipe(process.stderr);

  return subprocess;
}
