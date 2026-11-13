import { defineConfig } from 'vite';

export default defineConfig({
  base: './',   // relative paths, so the built page also works under a sub-folder such as GitHub Pages
  server: { host: '127.0.0.1', port: 5173, strictPort: true, open: process.env.NO_OPEN ? false : true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
