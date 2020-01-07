import { usePlugin, BuidlerConfig } from '@nomiclabs/buidler/config';

usePlugin('@nomiclabs/buidler-truffle5');
usePlugin('@nomiclabs/buidler-web3');

import './tasks/new_dao';

const config: BuidlerConfig = {
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: 'http://localhost:8545'
    }
  },
  solc: {
    version: '0.5.12',
  },
};

export default config;
