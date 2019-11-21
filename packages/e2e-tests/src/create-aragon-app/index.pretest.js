import test from "ava";
import execa from "execa";
import fs from "fs-extra";
import { startBackgroundProcess, normalizeOutput } from "../util";

const testSandbox = "./.tmp";

test("should create a new aragon app", async t => {
  t.plan(9);

  // arrange
  fs.ensureDirSync(testSandbox);
  const projectName = "foobar";
  const projectPath = `${testSandbox}/${projectName}`;
  const repoPath = `${projectPath}/.git`;
  const arappPath = `${projectPath}/arapp.json`;
  const packageJsonPath = `${projectPath}/package.json`;
  const licensePath = `${projectPath}/LICENSE`;

  // act
  const { stdout } = await startBackgroundProcess({
    cmd: "create-aragon-app",
    args: [projectName, 'react'],
    readyOutput: "Created new application",
    // keep this process alive after the test finished
    execaOpts: { cwd: testSandbox }
  });

  // hack, we need to install the dependencies of the app
  // await execa("npm", ["install"], { cwd: `${testSandbox}/${projectName}/app` });

  const packageJson = await fs.readJson(packageJsonPath);
  const arapp = await fs.readJson(arappPath);

  // delete some output sections that are not deterministic
  const installingDependenciesOutput = stdout.substring(
    stdout.indexOf("Installing package dependencies [started]"),
    stdout.indexOf("Installing package dependencies [completed]")
  );

  const installingIPFSOutput = stdout.substring(
    stdout.indexOf("Installing IPFS[started]"),
    stdout.indexOf("Installing IPFS [completed]")
  );

  const outputToSnapshot = stdout
    .replace(
      installingDependenciesOutput,
      "[deleted-installing-dependencies-output]"
    )
    .replace(installingIPFSOutput, "[deleted-installing-ipfs-output]");

  // assert
  t.true(normalizeOutput(outputToSnapshot).includes('Created new application'));
  t.true(await fs.pathExists(projectPath));
  t.true(await fs.pathExists(arappPath));
  t.falsy(await fs.pathExists(repoPath));
  t.falsy(fs.pathExistsSync(licensePath));
  t.is(undefined, packageJson.license);
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.default.appName);
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.rinkeby.appName);
  t.is(`${projectName}.open.aragonpm.eth`, arapp.environments.mainnet.appName);
});
