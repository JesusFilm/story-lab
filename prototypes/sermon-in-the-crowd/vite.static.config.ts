import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';

// Relative output runs independently or under the GitHub Pages project path.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) }, dedupe: ['three'] },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: 'dist-static', sourcemap: false },
});
