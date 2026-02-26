import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@obsidian-note-reviewer/editor';
import '@obsidian-note-reviewer/editor/styles';
import { AuthProvider } from '@obsidian-note-reviewer/security/auth';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App runtime="hook" />
    </AuthProvider>
  </React.StrictMode>
);
