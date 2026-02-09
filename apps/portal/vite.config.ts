import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteCSPPortal } from '@obsidian-note-reviewer/security/vite-plugin-csp';
import pkg from '../../package.json';

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), tailwindcss(), viteCSPPortal()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@obsidian-note-reviewer/ui': path.resolve(__dirname, '../../packages/ui'),
      '@obsidian-note-reviewer/editor/styles': path.resolve(__dirname, '../../packages/editor/index.css'),
      '@obsidian-note-reviewer/editor': path.resolve(__dirname, '../../packages/editor/App.tsx'),
      '@obsidian-note-reviewer/security/auth': path.resolve(__dirname, '../../packages/security/src/auth/context.tsx'),
      '@obsidian-note-reviewer/security/supabase/storage': path.resolve(__dirname, '../../packages/security/src/supabase/storage.ts'),
      '@obsidian-note-reviewer/security/supabase/client': path.resolve(__dirname, '../../packages/security/src/supabase/client.ts'),
      '@obsidian-note-reviewer/collaboration': path.resolve(__dirname, '../../packages/collaboration/src/index.ts'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: 'esnext',
  },
});
