import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/hangul-engine/',
  define: {
    __APP_VERSION__: JSON.stringify('0.8.7-filemaru.1'),
    __RHWP_DISABLE_EXTERNAL_WEBFONTS__: 'true',
    __RHWP_HWPCTRL__: 'false',
  },
  resolve: { alias: {
    '@': resolve(import.meta.dirname, 'src'),
    '@wasm': resolve(import.meta.dirname, 'node_modules/@rhwp/core'),
  } },
  build: { assetsInlineLimit: 0 },
});
