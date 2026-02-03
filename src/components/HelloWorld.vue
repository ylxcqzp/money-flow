<script setup>
/**
 * 欢迎组件 HelloWorld.vue
 * Vite + Vue 默认生成的示例组件
 */
import { ref } from 'vue'

defineProps({
  msg: String, // 欢迎消息
})

const count = ref(0) // 计数器状态
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">当前计数: {{ count }}</button>
    <p>
      修改
      <code>components/HelloWorld.vue</code> 以测试热更新 (HMR)
    </p>
  </div>

  <p>
    查看
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, 官方 Vue + Vite 起手工具
  </p>
  <p>
    了解更多关于 Vue 的 IDE 支持，请阅读
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue 文档扩展指南</a
    >.
  </p>
  <p class="read-the-docs">点击 Vite 和 Vue 图标了解更多信息</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
