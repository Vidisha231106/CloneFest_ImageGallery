import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This forwards any request starting with /api to your backend
      '/api': {
        target: 'http://localhost:4000', // Your backend server address
        changeOrigin: true,
      },
    }
  }
});