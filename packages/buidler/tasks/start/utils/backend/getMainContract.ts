import fs from 'fs';
import path from 'path';

/**
 * Returns main contract path
 * @return "./contracts/Counter.sol"
 */
function getMainContractPath(): string {
  const arappPath = 'arapp.json';
  const contractsPath = './contracts';

  if (fs.existsSync(arappPath)) {
    const arapp: { path: string } = JSON.parse(
      fs.readFileSync(arappPath, 'utf-8')
    );
    return arapp.path;
  }

  // Try to guess contract path
  if (fs.existsSync(contractsPath)) {
    const contracts = fs.readdirSync(contractsPath);
    const mainContract = contracts.filter(
      name => name.endsWith('.sol') || name !== 'Imports.sol'
    );
    if (mainContract.length === 1)
      return path.join(contractsPath, mainContract[0]);
  }

  throw Error(`No arapp.json found in current folder`);
}

/**
 * Returns main contract name
 * @return "Counter"
 */
function getMainContractName(): string {
  const mainContractPath = getMainContractPath();
  return path.parse(mainContractPath).name;
}

export {
  getMainContractPath,
  getMainContractName
};
