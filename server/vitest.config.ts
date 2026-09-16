import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 120000,
    globals: true,
    environment: 'node',
  },
});
