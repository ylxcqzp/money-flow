<template>
    <div>
        <h1>关于页面</h1>
        <p>当前计数: {{ count }}</p>
        <button @click="increment">点击增加</button>
    </div>
</template>

<script setup>
/**
 * 关于页面 About.vue (当前未在路由中使用)
 */
import { ref } from 'vue'

const count = ref(0) // 计数状态

/**
 * 增加计数器
 */
const increment = () => {
    count.value++
}
</script>

<style scoped>

</style>