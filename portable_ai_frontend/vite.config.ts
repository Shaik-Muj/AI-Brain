import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],  optimizeDeps: {
    include: ['react-pdf'],
    exclude: [],
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },  build: {
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs';
          }
        }
      },
    },
  },  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    'process.env.NODE_DEBUG': JSON.stringify('')
  }
})
