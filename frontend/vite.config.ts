import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Entertainment Pitch Assistant',
        short_name: 'EPA',
        description: 'Your personal Nigerian entertainment editor — daily pitches, hot topics, AI-powered ideas',
        theme_color: '#1D3557',
        background_color: '#F5F5F5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['news', 'productivity'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/topics/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'topics-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\/api\/pitches/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pitches-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 7200 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
