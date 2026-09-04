import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [angular(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['node_modules', 'e2e/**/*'],
    include: ['src/**/*.spec.ts'],
  }
});

