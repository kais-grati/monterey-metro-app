import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so the built site works from a file:// path or any
  // subdirectory (GitHub Pages project sites included).
  base: './',
});
