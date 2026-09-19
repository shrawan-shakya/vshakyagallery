import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Express API + local uploads live on :3001 in dev and preview
const API_PROXY = {
  '/api': 'http://localhost:3001',
  '/uploads': 'http://localhost:3001',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // host: true binds 0.0.0.0 so phones and other machines on the LAN can open the
  // gallery; Vite prints the Network URL on start. Express already listens on all
  // interfaces, and the proxy target stays localhost because the proxy runs here.
  server: { host: true, proxy: API_PROXY },
  preview: { host: true, proxy: API_PROXY },
  build: {
    rolldownOptions: {
      output: {
        // Keep the heavy, rarely-changing 3D libraries in their own chunks so a
        // UI-only deploy doesn't invalidate the visitor's cached three.js
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'r3f', test: /node_modules[\\/](@react-three|postprocessing|three-stdlib|camera-controls|maath|zustand|suspend-react|its-fine|@monogrid|three-mesh-bvh|detect-gpu|stats-gl|stats\.js)[\\/]/ },
          ],
        },
      },
    },
  },
})
