import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Serious Studies Only',
        short_name: 'SSO',
        description: 'A private scrapbook for you and your partner.',
        theme_color: '#2b133d', // Matches the dark theme
        background_color: '#0a0c27', // Matches the dark theme
        start_url: '/',
        display: 'standalone', // This tells the browser to open as a standalone app
        scope: '/',
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