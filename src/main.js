/**
 * 入口文件 main.js
 * 用于初始化 Vue 应用实例，配置全局插件（Pinia, Router）并挂载应用
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

// 创建 Vue 应用实例
const app = createApp(App)

// 初始化状态管理插件 Pinia
const pinia = createPinia()

// 使用 Pinia 插件进行状态管理
app.use(pinia)

// 使用 Vue Router 插件进行路由管理
app.use(router)

// 将应用挂载到 index.html 中的 #app 容器
app.mount('#app')
