import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';
import commonjs from '@rollup/plugin-commonjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    extensions: ['.js']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    ssr: resolve(__dirname, 'src/main.js'),
    target: 'node18',
    minify: false,
    rollupOptions: {
      plugins: [
        commonjs({
          ignoreDynamicRequires: true
        })
      ],
      external: [
        ...builtinModules,
        ...builtinModules.map(m => 'node:' + m),
        'mysql',
        'redis',
        'ws',
        'multiparty',
        'log4js'
      ],
      output: {
        format: 'cjs',
        entryFileNames: 'main.js',
        exports: 'named'
      }
    }
  }
});