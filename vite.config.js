import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Vite 配置文件
 * https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [vue()], // 启用 Vue 插件支持 SFC
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src') // 配置 @ 别名指向 src 目录
    }
  },
  server: {
    port: 8080,      // 开发服务器端口
    host: true,      // 允许通过内网 IP 访问
    strictPort: true, // 如果端口被占用则直接退出，而不是尝试下一个
  },
})
