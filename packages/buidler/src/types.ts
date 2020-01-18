export interface AragonConfig {
  appServePort?: number;
  clientServePort?: number;
  appSrcPath?: string;
  appBuildOutputPath?: string;
}

/**
 * arapp.json
 */
export interface AragonAppJson {
  roles: Role[];
  environment: AragonEnvironments;
  path: string;
}

interface Role {
  name: string;
  id: string;
  params: any[];
  bytes: string;
}

interface AragonEnvironments {
  [environmentName: string]: AragonEnvironment;
}

interface AragonEnvironment {
  network: string;
  appName: string;
  registry: string;
  wsRPC: string;
}
