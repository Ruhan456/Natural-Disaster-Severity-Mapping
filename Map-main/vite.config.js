import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // Automatically open browser when running `npm start`
  },
  build: {
    outDir: 'dist', // Output folder for build
  },
  resolve: {
    alias: {
      '@': '/src', // Optional: Makes imports cleaner, e.g., '@/components/...' instead of './components/...'
    },
  },
});
