import buidlerConfig from '../buidler.config';
import { AragonConfig } from './types';

/**
 * Tries to obtain values from buidler.config.ts or
 * otherwise provides default values.
 * @returns AragonConfig
 */
export function getConfig(): AragonConfig {
  const config = buidlerConfig.aragon;

  return {
    appServePort: config.appServePort || 8001,
    clientServePort: config.clientServePort || 3000,
    appSrcPath: config.appSrcPath || 'app/',
    appBuildOutputPath: config.appBuildOutputPath || 'dist/',
  };
}
