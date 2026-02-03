<template>
    <div>
        <h1>About</h1>
        <p>Count: {{ count }}</p>
        <button @click="increment">Increment</button>
    </div>
</template>

<script setup>
import { ref } from 'vue'
let count = ref(0)
let increment = () => {
    count.value++
}
</script>

<style scoped>

</style>