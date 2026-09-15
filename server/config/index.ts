import config, { env, type EnvConfig } from './env.js';

export { config, env, type EnvConfig };
export {
  db,
  pool,
  createPgPool,
  createKyselyInstance,
  pingDatabase,
  closeDatabase,
  type DatabasePoolConfig,
} from './database.js';

export default config;
