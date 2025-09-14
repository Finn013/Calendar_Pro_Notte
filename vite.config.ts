import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
// https://vitejs.dev/config/
export default defineConfig({
  base: '/Calendar_Pro_Notte/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'inline',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            }
          }
        ],
        navigateFallback: '/Calendar_Pro_Notte/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false
      },
      manifest: {
        name: 'Calendar Pro Notte',
        short_name: 'Calendar Pro',
        description: 'Профессиональный календарь с заметками и списками',
        start_url: '/Calendar_Pro_Notte/',
        display: 'standalone',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        icons: [
          {
            src: '/Calendar_Pro_Notte/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: '/Calendar_Pro_Notte/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Отключаем sourcemap для production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    // Убираем console.log в production
    'console.log': import.meta.env.PROD ? '() => {}' : 'console.log'
  }
})