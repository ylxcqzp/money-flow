<script setup>
/**
 * 预算设置组件 BudgetSetter.vue
 * 提供一个界面，允许用户为当前选中的月份设置总支出预算以及各分类的月度限额
 */
import { ref, computed } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { Check, ChevronDown, ChevronUp, AlertCircle, Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle } from 'lucide-vue-next'

// --- 定义事件与 Store ---

const emit = defineEmits(['success']) // 事件：保存成功后触发
const store = useTransactionStore()

// 图标组件映射表
const iconComponents = {
  Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, 
  ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle
}

const getIcon = (name) => iconComponents[name] || HelpCircle

// --- 响应式数据 ---

// 获取当前月份的原始预算数据
const rawBudgetData = store.budgets[store.currentMonthKey] || {}
const isOldFormat = typeof rawBudgetData === 'number'

// 预算金额输入值
const totalBudget = ref(isOldFormat ? rawBudgetData : (rawBudgetData.total || store.currentMonthBudget || ''))
// 分类预算输入值 { catId: amount }
const categoryBudgets = ref(isOldFormat ? {} : { ...(rawBudgetData.categories || {}) })

// 控制分类预算区域的展开/收起
const showCategoryBudgets = ref(Object.keys(categoryBudgets.value).length > 0)

// --- 计算属性 ---

/**
 * 计算当前所有分类预算的总和
 */
const totalCategoryBudget = computed(() => {
  return Object.values(categoryBudgets.value).reduce((sum, val) => {
    return sum + (Number(val) || 0)
  }, 0)
})

/**
 * 校验：分类预算总和是否超过了总预算
 */
const isOverTotal = computed(() => {
  const total = Number(totalBudget.value) || 0
  return total > 0 && totalCategoryBudget.value > total
})

/**
 * 过滤出支出类型的顶级分类
 */
const expenseCategories = computed(() => {
  return store.categories.filter(c => c.type === 'expense')
})

// --- 业务逻辑 ---

/**
 * 处理保存预算的操作
 */
const handleSave = () => {
  if (isOverTotal.value) {
    store.addNotification('分类预算总和不能超过总预算金额', 'error')
    return
  }
  
  const budgetData = {
    total: Number(totalBudget.value),
    categories: {}
  }

  // 整理分类预算，过滤掉空值
  Object.entries(categoryBudgets.value).forEach(([id, amount]) => {
    if (amount !== '' && amount !== null && Number(amount) > 0) {
      budgetData.categories[id] = Number(amount)
    }
  })

  // 将输入值存入 Store
  store.setBudget(store.currentMonthKey, budgetData)
  
  // 发出成功事件
  emit('success')
}
</script>

<template>
  <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
    <!-- 提示信息：显示当前正在设置的月份 -->
    <div class="p-4 bg-primary-50 rounded-xl text-primary-700 text-sm flex items-center justify-between">
      <span>正在设置 <strong>{{ store.currentMonthKey }}</strong> 的支出预算</span>
      <span class="text-[10px] bg-white px-2 py-0.5 rounded-full border border-primary-100 font-bold uppercase tracking-wider">Monthly Budget</span>
    </div>

    <!-- 总预算输入 -->
    <div class="space-y-2">
      <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider px-1">总预算金额</label>
      <div class="relative group">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-primary-500 transition-colors">¥</span>
        <input 
          v-model="totalBudget"
          type="number" 
          step="100"
          required
          placeholder="0.00"
          class="w-full pl-8 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-2xl font-bold placeholder:text-slate-200"
        />
      </div>
      <p class="text-[11px] text-slate-400 px-1 italic">设置总预算可以帮助您更好地控制整体消费水平。</p>
      
      <!-- 超支警告 -->
      <div v-if="isOverTotal" class="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 animate-in fade-in zoom-in duration-200">
        <AlertCircle :size="14" />
        <span class="text-xs font-bold">分类预算总和 (¥{{ totalCategoryBudget }}) 已超过总预算</span>
      </div>
    </div>

    <!-- 分类预算设置 -->
    <div class="space-y-4 pt-2 border-t border-slate-50">
      <button 
        @click="showCategoryBudgets = !showCategoryBudgets"
        class="flex items-center justify-between w-full px-1 group"
      >
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">细分分类预算 (可选)</span>
        <div class="p-1 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-slate-100 transition-colors">
          <component :is="showCategoryBudgets ? ChevronUp : ChevronDown" :size="14" />
        </div>
      </button>

      <div v-if="showCategoryBudgets" class="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <div 
          v-for="cat in expenseCategories" 
          :key="cat.id"
          class="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white transition-all"
        >
          <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-50">
            <component :is="getIcon(cat.icon)" :size="18" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-slate-700">{{ cat.name }}</p>
          </div>
          <div class="w-32 relative group">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 group-focus-within:text-primary-400 transition-colors">¥</span>
            <input 
              v-model="categoryBudgets[cat.id]"
              type="number"
              placeholder="限额"
              class="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-bold placeholder:text-slate-200"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="pt-2">
      <button 
        @click="handleSave"
        class="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary-200 flex items-center justify-center gap-2 group"
      >
        <Check :size="20" class="group-hover:scale-110 transition-transform" />
        保存所有预算设置
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
