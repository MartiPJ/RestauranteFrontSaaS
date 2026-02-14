import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3001,
    // AÑADE ESTA CONFIGURACIÓN DE PROXY
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000', // Tu backend NestJS
    //     changeOrigin: true,
    //     secure: false,
    //     rewrite: (path) => path.replace(/^\/api/, '/api'), // Mantiene el prefijo /api
    //   },
    // },
  },

  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
