import { defineConfig } from 'vite';

// base './' so the built site works from any sub-path (GitHub Pages, Vercel, or opened offline).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1200 },
});
