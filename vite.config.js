import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Configure the dev server
  server: {
    port: 5173,              // or whatever port you prefer
    host: 'localhost',       // ensure it's accessible at localhost
    proxy: {
      // Example: if your React app calls `/api/...`, 
      // proxy those requests to your backend at 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
