<script setup>
import { ref } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { Check } from 'lucide-vue-next'

const emit = defineEmits(['success'])
const store = useTransactionStore()

const budgetAmount = ref(store.currentMonthBudget || '')

const handleSave = () => {
  store.setBudget(store.currentMonthKey, Number(budgetAmount.value))
  emit('success')
}
</script>

<template>
  <div class="space-y-6">
    <div class="p-4 bg-primary-50 rounded-xl text-primary-700 text-sm">
      正在设置 <strong>{{ store.currentMonthKey }}</strong> 的支出预算。
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1">预算金额</label>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
        <input 
          v-model="budgetAmount"
          type="number" 
          step="100"
          required
          placeholder="0.00"
          class="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-xl font-semibold"
        />
      </div>
      <p class="mt-2 text-xs text-slate-400">设置预算可以帮助您更好地控制当月消费。</p>
    </div>

    <button 
      @click="handleSave"
      class="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary-100 flex items-center justify-center gap-2"
    >
      <Check :size="20" />
      保存设置
    </button>
  </div>
</template>
