import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    host: true, // 允许通过内网 IP 访问
    strictPort: true, // 如果端口被占用则直接退出，而不是尝试下一个
  },
})
