// vite.config.js
//
// Vite is the build tool + dev server for our React app.
// It is MUCH faster than create-react-app (react-scripts).
//
// The "proxy" setting below means:
//   Any request from React to /upload
//   gets automatically forwarded to http://localhost:5000/upload (Flask)
//
// This way we don't need flask-cors OR a hardcoded Flask URL in our code.
// React just calls /upload and Vite handles the rest.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],   // enables JSX support

  server: {
    port: 3000,         // React dev server runs on port 3000
    proxy: {
      // Forward any request starting with /upload → Flask
      '/upload': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
