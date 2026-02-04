<script setup>
/**
 * 交易记录列表组件 TransactionList.vue
 * 用于展示过滤后的交易记录，并支持编辑和删除操作
 */
import { useTransactionStore } from '../stores/transaction'
import { Trash2, Calendar, Tag, Edit2, ArrowRightLeft, Loader2, Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle, Hash, Plus, HeartPulse, GraduationCap, Gift, Home, Sparkles, Key, Zap, Wrench, Briefcase, PenTool, Plane, Ticket, Camera, Cpu, Smartphone, Cloud, Wifi, Dog, Bone, ToyBrick, Scissors, Droplets, Dumbbell, Footprints, MoreHorizontal, LineChart, PieChart, RotateCcw, ArrowUpDown, ChevronDown, Check } from 'lucide-vue-next'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ref } from 'vue'

const store = useTransactionStore()
const emit = defineEmits(['edit', 'add'])

const activeTab = ref('list') // 'list' or 'ranking'
const deletingId = ref(null)

/**
 * 处理删除操作
 */
const handleDelete = async (id) => {
  if (deletingId.value) return
  if (!confirm('确定要删除这条记录吗？')) return

  deletingId.value = id
  await store.deleteTransaction(id)
  deletingId.value = null
}

/**
 * 格式化货币显示 (人民币)
 * @param {number} value 数值
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value)
}

/**
 * 格式化外币显示
 * @param {number} value 数值
 * @param {string} currencyCode 币种代码
 */
const formatForeignCurrency = (value, currencyCode) => {
  if (!currencyCode || currencyCode === 'CNY') return null
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(value)
  } catch (e) {
    return `${currencyCode} ${value}`
  }
}

/**
 * 格式化日期显示
 * @param {string} dateStr 日期字符串
 */
const formatDate = (dateStr) => {
  return format(new Date(dateStr), 'yyyy年MM月dd日', { locale: zhCN })
}

/**
 * 获取账户名称
 * @param {string} accountId 账户ID
 */
const getAccountName = (accountId) => {
  const account = store.accounts.find(a => a.id === accountId)
  return account ? account.name : '未知账户'
}

/**
 * 获取交易分类信息（父分类与子分类拼接）
 * @param {Object} transaction 交易记录对象
 */
const getCategoryInfo = (transaction) => {
  if (transaction.type === 'transfer') return null
  
  const parent = store.findCategoryById(transaction.categoryId)
  const sub = transaction.subCategoryId ? store.findCategoryById(transaction.subCategoryId) : null
  
  return {
    name: sub ? `${parent?.name} · ${sub.name}` : (parent?.name || transaction.category || '未分类'),
    icon: sub?.icon || parent?.icon || 'HelpCircle'
  }
}

/**
 * 根据名称获取图标组件
 * @param {string} name 图标名称
 */
const getIcon = (name) => {
  const icons = {
    Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HeartPulse, GraduationCap, Gift, Home, Sparkles, Key, Zap, Wrench, Briefcase, PenTool, Plane, Ticket, Camera, Cpu, Smartphone, Cloud, Wifi, Dog, Bone, ToyBrick, Scissors, Droplets, Dumbbell, Footprints, MoreHorizontal, LineChart, PieChart, RotateCcw, ArrowUpDown, ChevronDown, Check
  }
  return icons[name] || HelpCircle
}
</script>

<template>
  <div class="perspective-2000 h-full">
    <div 
      class="relative transition-all duration-800 preserve-3d h-full [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]"
      :class="{ 
        '[transform:rotateY(180deg)_scale(0.98)]': activeTab === 'ranking',
        'scale-100': activeTab === 'list'
      }"
    >
      <!-- List View (Front Face) -->
      <div class="backface-hidden bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-3">
              <button 
                @click="activeTab = 'list'"
                class="text-lg font-bold transition-colors relative"
                :class="activeTab === 'list' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'"
              >
                收支明细
                <div v-if="activeTab === 'list'" class="absolute -bottom-2 left-0 right-0 h-1 bg-primary-500 rounded-full"></div>
              </button>
              <div class="h-4 w-[1px] bg-slate-200"></div>
              <button 
                @click="activeTab = 'ranking'"
                class="text-lg font-bold transition-colors relative"
                :class="activeTab === 'ranking' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'"
              >
                支出排行
                <div v-if="activeTab === 'ranking'" class="absolute -bottom-2 left-0 right-0 h-1 bg-rose-500 rounded-full"></div>
              </button>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full ml-1">
                {{ store.filteredTransactions.length }}
              </span>
            </div>
          </div>
          
          <!-- Sorting Controls -->
          <div class="flex items-center gap-2">
            <div class="relative group/sort">
              <button class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200">
                <ArrowUpDown :size="14" />
                <span>{{ 
                  store.sortConfig.key === 'date' ? '按日期' : 
                  store.sortConfig.key === 'amount' ? '按金额' : '按分类' 
                }}</span>
                <span class="text-[10px] text-slate-400">({{ store.sortConfig.order === 'desc' ? '降序' : '升序' }})</span>
                <ChevronDown :size="12" class="text-slate-400 group-hover/sort:rotate-180 transition-transform" />
              </button>
              
              <!-- Dropdown -->
              <div class="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 shadow-xl rounded-xl py-1 z-50 opacity-0 invisible group-hover/sort:opacity-100 group-hover/sort:visible transition-all transform origin-top-right scale-95 group-hover/sort:scale-100">
                <button 
                  @click="store.setSort('date')"
                  class="w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between"
                  :class="{ 'text-primary-600 bg-primary-50/50': store.sortConfig.key === 'date' }"
                >
                  日期排序
                  <Check v-if="store.sortConfig.key === 'date'" :size="12" />
                </button>
                <button 
                  @click="store.setSort('amount')"
                  class="w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between"
                  :class="{ 'text-primary-600 bg-primary-50/50': store.sortConfig.key === 'amount' }"
                >
                  金额排序
                  <Check v-if="store.sortConfig.key === 'amount'" :size="12" />
                </button>
                <button 
                  @click="store.setSort('category')"
                  class="w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-between"
                  :class="{ 'text-primary-600 bg-primary-50/50': store.sortConfig.key === 'category' }"
                >
                  分类排序
                  <Check v-if="store.sortConfig.key === 'category'" :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar flex-1">
          <div v-if="store.filteredTransactions.length === 0" class="p-16 text-center">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
              <Calendar class="text-slate-200" :size="40" />
            </div>
            <h3 class="text-slate-900 font-bold mb-2">还没有账单记录</h3>
            <p class="text-slate-400 text-sm mb-8">良好的记账习惯从第一笔开始</p>
            <button 
              @click="emit('add')"
              class="inline-flex items-center gap-2 px-6 py-3 bg-primary-50 text-primary-600 rounded-xl font-bold hover:bg-primary-600 hover:text-white transition-all active:scale-95 group"
            >
              <Plus :size="20" />
              点这里开始记录
            </button>
          </div>

          <div 
            v-for="transaction in store.filteredTransactions" 
            :key="transaction.id"
            class="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors group"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-start gap-4 min-w-0">
                <!-- Icon Wrapper -->
                <div 
                  class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                  :class="{
                    'bg-emerald-50 text-emerald-600': transaction.type === 'income',
                    'bg-rose-50 text-rose-600': transaction.type === 'expense',
                    'bg-blue-50 text-blue-600': transaction.type === 'transfer'
                  }"
                >
                  <template v-if="transaction.type === 'transfer'">
                    <ArrowRightLeft :size="22" />
                  </template>
                  <template v-else>
                    <component :is="getIcon(getCategoryInfo(transaction).icon)" :size="22" />
                  </template>
                </div>

                <!-- Info Wrapper -->
                <div class="min-w-0">
                  <!-- Category / Title -->
                  <h3 class="text-base font-bold text-slate-900 leading-tight truncate">
                    {{ transaction.type === 'transfer' ? '账户转账' : getCategoryInfo(transaction).name }}
                  </h3>

                  <!-- Description / Remark -->
                  <p v-if="transaction.description" class="text-sm text-slate-500 mt-1 line-clamp-1">
                    {{ transaction.description }}
                  </p>

                  <!-- Meta Info -->
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                    <span class="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Calendar :size="12" />
                      {{ formatDate(transaction.date) }}
                    </span>
                    
                    <div class="h-1 w-1 rounded-full bg-slate-200"></div>

                    <span v-if="transaction.type !== 'transfer'" class="flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                      {{ getAccountName(transaction.accountId || '1') }}
                    </span>
                    <span v-else class="flex items-center gap-1.5 text-[11px] font-bold">
                      <span class="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                        {{ getAccountName(transaction.fromAccountId) }}
                      </span>
                      <ArrowRightLeft :size="10" class="text-slate-300" />
                      <span class="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                        {{ getAccountName(transaction.toAccountId) }}
                      </span>
                    </span>

                    <!-- Tags -->
                    <template v-if="transaction.tags?.length">
                      <div class="h-1 w-1 rounded-full bg-slate-200"></div>
                      <div class="flex flex-wrap gap-1">
                        <button 
                          v-for="tag in transaction.tags" 
                          :key="tag"
                          @click.stop="store.toggleTagFilter(tag)"
                          class="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[10px] font-bold border border-slate-100 hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50 transition-all"
                          :class="{ 'bg-primary-50 border-primary-200 text-primary-600': store.selectedTags.includes(tag) }"
                        >
                          <Hash :size="8" />
                          {{ tag }}
                        </button>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-4 shrink-0">
                <div class="text-right">
                  <p 
                    class="text-lg font-black tracking-tight"
                    :class="{
                      'text-emerald-600': transaction.type === 'income',
                      'text-rose-600': transaction.type === 'expense',
                      'text-blue-600': transaction.type === 'transfer'
                    }"
                  >
                    {{ transaction.type === 'income' ? '+' : (transaction.type === 'expense' ? '-' : '') }}{{ formatCurrency(Math.abs(transaction.amount)) }}
                  </p>
                  <!-- Foreign Currency Original Amount -->
                  <p 
                    v-if="transaction.currency && transaction.currency !== store.baseCurrency" 
                    class="text-[10px] text-slate-400 font-bold mt-0.5"
                  >
                    {{ transaction.type === 'income' ? '+' : (transaction.type === 'expense' ? '-' : '') }}{{ formatForeignCurrency(Math.abs(transaction.originalAmount || transaction.amount), transaction.currency) }}
                  </p>
                </div>
                
                <!-- Actions -->
                <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <button 
                    @click="emit('edit', transaction)"
                    class="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                    title="编辑"
                  >
                    <Edit2 :size="16" />
                  </button>
                  <button 
                    @click="handleDelete(transaction.id)"
                    :disabled="deletingId === transaction.id"
                    class="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="删除"
                  >
                    <Loader2 v-if="deletingId === transaction.id" class="animate-spin" :size="16" />
                    <Trash2 v-else :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ranking View (Back Face) -->
      <div class="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-3">
              <button 
                @click="activeTab = 'list'"
                class="text-lg font-bold transition-colors relative"
                :class="activeTab === 'list' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'"
              >
                收支明细
                <div v-if="activeTab === 'list'" class="absolute -bottom-2 left-0 right-0 h-1 bg-primary-500 rounded-full"></div>
              </button>
              <div class="h-4 w-[1px] bg-slate-200"></div>
              <button 
                @click="activeTab = 'ranking'"
                class="text-lg font-bold transition-colors relative"
                :class="activeTab === 'ranking' ? 'text-slate-800' : 'text-slate-300 hover:text-slate-400'"
              >
                支出排行
                <div v-if="activeTab === 'ranking'" class="absolute -bottom-2 left-0 right-0 h-1 bg-rose-500 rounded-full"></div>
              </button>
            </div>
          </div>
        </div>

        <div class="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar flex-1">
          <div v-if="store.categoryRankings.length === 0" class="p-16 text-center">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp class="text-slate-200" :size="40" />
            </div>
            <h3 class="text-slate-900 font-bold mb-2">暂无支出排行数据</h3>
            <p class="text-slate-400 text-sm">当前筛选条件下没有支出记录</p>
          </div>

          <div v-else class="p-6 space-y-8">
            <div 
              v-for="item in store.categoryRankings" 
              :key="item.id"
              class="relative group"
            >
              <div class="flex gap-4 items-start">
                <!-- Left Side: Icon -->
                <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 shadow-sm group-hover:bg-rose-100 group-hover:scale-110 transition-all duration-300">
                  <component :is="getIcon(item.icon)" :size="24" />
                </div>

                <!-- Right Side: Content -->
                <div class="flex-1 space-y-3">
                  <!-- Top: Category Name -->
                  <div class="flex justify-between items-center">
                    <h4 class="text-sm font-bold text-slate-800">{{ item.name }}</h4>
                    <span class="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                      {{ item.percentage.toFixed(1) }}%
                    </span>
                  </div>
                  
                  <!-- Middle: Progress Bar -->
                  <div class="h-2 w-full bg-rose-50 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out origin-left shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                      :style="{ width: `${item.percentage}%` }"
                    ></div>
                  </div>

                  <!-- Bottom: Stats -->
                  <div class="flex justify-between items-center">
                    <p class="text-[11px] font-medium text-slate-500">
                      {{ store.filterType === 'year' ? '本年' : store.filterType === 'month' ? '本月' : '该时段' }}共支出 
                      <span class="text-rose-600 font-bold ml-1">{{ formatCurrency(item.amount) }}</span>
                    </p>
                    <p class="text-[11px] font-bold text-slate-900 bg-rose-50 px-2 py-0.5 rounded-md text-rose-700">
                      消费 {{ item.count }} 笔
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-2000 {
  perspective: 2000px;
}

.preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
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
