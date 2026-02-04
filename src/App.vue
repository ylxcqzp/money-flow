<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'

/**
 * 根组件 App.vue
 * 负责应用的基础布局和路由视图的渲染
 * 同时在应用启动时检查并生成周期性交易
 */

const authStore = useAuthStore()
const transactionStore = useTransactionStore()

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await transactionStore.checkAndGenerateRecurring()
  }
})
</script>

<template>
  <!-- 路由视图出口，根据当前路由渲染对应的页面组件 -->
  <router-view></router-view>
</template>

<style>
/* 
 * 全局样式
 * 此处可以定义跨组件使用的 CSS 变量或基础样式重置
 */
</style>
