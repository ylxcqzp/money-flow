<script setup>
import { useTransactionStore } from '../stores/transaction'
import { Trash2, Calendar, Tag, Edit2, ArrowRightLeft, Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle, Hash } from 'lucide-vue-next'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const store = useTransactionStore()
const emit = defineEmits(['edit'])

const formatCurrency = (value) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value)
}

const formatDate = (dateStr) => {
  return format(new Date(dateStr), 'MMM do, yyyy', { locale: zhCN })
}

const getAccountName = (accountId) => {
  const account = store.accounts.find(a => a.id === accountId)
  return account ? account.name : '未知账户'
}

const getCategoryInfo = (transaction) => {
  if (transaction.type === 'transfer') return null
  
  const parent = store.findCategoryById(transaction.categoryId)
  const sub = transaction.subCategoryId ? store.findCategoryById(transaction.subCategoryId) : null
  
  return {
    name: sub ? `${parent?.name} · ${sub.name}` : (parent?.name || transaction.category || '未分类'),
    icon: sub?.icon || parent?.icon || 'HelpCircle'
  }
}

const getIcon = (name) => {
  const icons = {
    Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp
  }
  return icons[name] || HelpCircle
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-slate-800">收支明细</h2>
      <span class="text-sm text-slate-500">共 {{ store.filteredTransactions.length }} 条记录</span>
    </div>

    <div class="divide-y divide-slate-100">
      <div v-if="store.filteredTransactions.length === 0" class="p-12 text-center">
        <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar class="text-slate-300" :size="32" />
        </div>
        <p class="text-slate-400">还没有任何记录，开始记账吧！</p>
      </div>

      <div 
        v-for="transaction in store.filteredTransactions" 
        :key="transaction.id"
        class="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors group"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="{
                'bg-emerald-50 text-emerald-600': transaction.type === 'income',
                'bg-rose-50 text-rose-600': transaction.type === 'expense',
                'bg-blue-50 text-blue-600': transaction.type === 'transfer'
              }"
            >
              <template v-if="transaction.type === 'transfer'">
                <ArrowRightLeft :size="24" />
              </template>
              <template v-else>
                <component :is="getIcon(getCategoryInfo(transaction).icon)" :size="24" />
              </template>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800">{{ transaction.description }}</h3>
              <div class="flex items-center gap-3 mt-1">
                <span class="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar :size="12" />
                  {{ formatDate(transaction.date) }}
                </span>
                <span v-if="transaction.type !== 'transfer'" class="flex items-center gap-1 text-xs text-slate-400">
                  <Tag :size="12" />
                  {{ getCategoryInfo(transaction).name }}
                </span>
                <span v-if="transaction.type !== 'transfer'" class="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                  {{ getAccountName(transaction.accountId || '1') }}
                </span>
                <span v-else class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                    {{ getAccountName(transaction.fromAccountId) }}
                  </span>
                  <ArrowRightLeft :size="10" class="text-slate-300" />
                  <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                    {{ getAccountName(transaction.toAccountId) }}
                  </span>
                </span>
              </div>
              <!-- Tags -->
              <div v-if="transaction.tags?.length" class="flex flex-wrap gap-1 mt-2">
                <button 
                  v-for="tag in transaction.tags" 
                  :key="tag"
                  @click.stop="store.toggleTagFilter(tag)"
                  class="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-bold border border-slate-100 hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  :class="{ 'bg-primary-50 border-primary-200 text-primary-600': store.selectedTags.includes(tag) }"
                >
                  <Hash :size="8" />
                  {{ tag }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <p 
              class="text-lg font-bold"
              :class="{
                'text-emerald-600': transaction.type === 'income',
                'text-rose-600': transaction.type === 'expense',
                'text-blue-600': transaction.type === 'transfer'
              }"
            >
              {{ transaction.type === 'income' ? '+' : (transaction.type === 'expense' ? '-' : '') }}{{ formatCurrency(Math.abs(transaction.amount)) }}
            </p>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                @click="emit('edit', transaction)"
                class="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
              >
                <Edit2 :size="18" />
              </button>
              <button 
                @click="store.deleteTransaction(transaction.id)"
                class="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
