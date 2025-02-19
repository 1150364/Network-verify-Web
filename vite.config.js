import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/admin': {
        target: 'http://110.40.59.115:29406',//http://110.40.63.163:29406
        changeOrigin: true,
      }
    }
  }
})
