import { AragonEnvironments } from '../types'

import defaultEnvironmentsSrc from './environments.default.json'

// JSON files are imported in this unique file until Typescript x JSON import issues are fixed
// Afterwards, keep this file since this config files may change and then it will only
// require modifying the imports in a single file

/* eslint-disable @typescript-eslint/no-var-requires */

export const defaultEnvironments: AragonEnvironments = defaultEnvironmentsSrc
