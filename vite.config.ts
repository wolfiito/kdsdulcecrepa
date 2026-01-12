// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Estrategia de actualización automática (para que los cocineros siempre tengan la última versión)
      registerType: 'autoUpdate', 
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      
      // CONFIGURACIÓN DEL MANIFIESTO (Cómo se ve la App instalada)
      manifest: {
        name: 'KDS Dulce Crepa',
        short_name: 'DulceCrepaKDS',
        description: 'Sistema de Pantalla de Cocina para Dulce Crepa',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Esto elimina la barra de URL del navegador (Look nativo)
        orientation: 'landscape', // Fuerza la vista horizontal (ideal para tablets)
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Importante para Android
          }
        ]
      }
    })
  ]
})