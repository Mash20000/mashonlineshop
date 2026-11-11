import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Hosts allowed to open the dev server. The leading dot also allows sub-domains,
    // so any ngrok address works. Add your own domain here if you use another tunnel.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
