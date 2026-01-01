import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteCSPMarketing } from '@obsidian-note-reviewer/security/vite-plugin-csp';

export default defineConfig({
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss(), viteCSPMarketing()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@obsidian-note-reviewer/ui': path.resolve(__dirname, '../../packages/ui'),
      '@obsidian-note-reviewer/editor/styles': path.resolve(__dirname, '../../packages/editor/index.css'),
      '@obsidian-note-reviewer/editor': path.resolve(__dirname, '../../packages/editor/App.tsx'),
    }
  },
  build: {
    target: 'esnext',
  },
});
