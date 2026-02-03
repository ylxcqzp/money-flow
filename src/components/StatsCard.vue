<script setup>
defineProps({
  title: String,
  amount: Number,
  type: String,
  icon: Object
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value)
}
</script>

<template>
  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
    <div class="flex items-center gap-4">
      <div 
        class="w-12 h-12 rounded-xl flex items-center justify-center"
        :class="{
          'bg-primary-50 text-primary-600': type === 'balance',
          'bg-emerald-50 text-emerald-600': type === 'income',
          'bg-rose-50 text-rose-600': type === 'expense'
        }"
      >
        <component :is="icon" :size="24" />
      </div>
      <div>
        <p class="text-sm font-medium text-slate-500">{{ title }}</p>
        <p 
          class="text-2xl font-bold"
          :class="{
            'text-slate-900': type === 'balance',
            'text-emerald-600': type === 'income',
            'text-rose-600': type === 'expense'
          }"
        >
          {{ formatCurrency(amount) }}
        </p>
      </div>
    </div>
  </div>
</template>
