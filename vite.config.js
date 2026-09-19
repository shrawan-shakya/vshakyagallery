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
  server: { proxy: API_PROXY },
  preview: { proxy: API_PROXY },
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
