import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Serious Studies',
        short_name: 'SSO',
        description: 'A private scrapbook for you and your partner.',
        theme_color: '#9CAF88',
        background_color: '#ffffff', // Added for the launch splash screen
        start_url: '/',             // Added to define the app's starting page
        display: 'standalone',      // This is the critical fix for the full-screen experience
        icons: [
          {
            src: './pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: './pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})