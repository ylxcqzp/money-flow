<script setup>
import { useTransactionStore } from '../stores/transaction'
import StatsCard from '../components/StatsCard.vue'
import TransactionForm from '../components/TransactionForm.vue'
import TransactionList from '../components/TransactionList.vue'
import CategoryChart from '../components/CategoryChart.vue'
import BudgetSetter from '../components/BudgetSetter.vue'
import RecurringTransactionForm from '../components/RecurringTransactionForm.vue'
import CategoryManager from '../components/CategoryManager.vue'
import AccountManager from '../components/AccountManager.vue'
import { Wallet, TrendingUp, TrendingDown, Plus, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Settings, AlertCircle, Repeat, Trash2, CreditCard, Smartphone, MessageCircle, LayoutGrid, Tag as TagIcon, Hash, Check, BarChart3 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { ref, computed, onMounted } from 'vue'
import { format, addYears, addMonths, addDays, subYears, subMonths, subDays } from 'date-fns'

const store = useTransactionStore()
const router = useRouter()
const showForm = ref(false)
const showBudgetSetter = ref(false)
const showRecurringForm = ref(false)
const showCategoryManager = ref(false)
const showAccountManager = ref(false)
const editingTransaction = ref(null)

onMounted(() => {
  store.checkAndGenerateRecurring()
})

const handleEdit = (transaction) => {
  editingTransaction.value = transaction
  showForm.value = true
}

const handleFormSuccess = () => {
  showForm.value = false
  editingTransaction.value = null
}

const closeForm = () => {
  showForm.value = false
  editingTransaction.value = null
}

// Filter logic
const filterLabel = computed(() => {
  if (store.filterType === 'year') return format(store.filterDate, 'yyyy年')
  if (store.filterType === 'month') return format(store.filterDate, 'yyyy年MM月')
  if (store.filterType === 'day') return format(store.filterDate, 'yyyy年MM月dd日')
  return '全部记录'
})

const navigateFilter = (direction) => {
  const amount = direction === 'next' ? 1 : -1
  let newDate = new Date(store.filterDate)
  
  if (store.filterType === 'year') {
    newDate = amount > 0 ? addYears(newDate, 1) : subYears(newDate, 1)
  } else if (store.filterType === 'month') {
    newDate = amount > 0 ? addMonths(newDate, 1) : subMonths(newDate, 1)
  } else if (store.filterType === 'day') {
    newDate = amount > 0 ? addDays(newDate, 1) : subDays(newDate, 1)
  }
  
  store.filterDate = newDate
}

const getAccountIcon = (iconName) => {
  const icons = {
    Wallet,
    CreditCard,
    Smartphone,
    MessageCircle
  }
  return icons[iconName] || Wallet
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-12">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
            <Wallet :size="24" />
          </div>
          <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
            个人记账
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="router.push('/statistics')"
            class="flex items-center gap-2 text-slate-600 hover:text-primary-600 px-3 py-2 rounded-lg transition-all hover:bg-primary-50"
          >
            <BarChart3 :size="20" />
            <span class="text-sm font-medium">数据分析</span>
          </button>
          <button 
            @click="showForm = true"
            class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-primary-200"
          >
            <Plus :size="20" />
            <span>记一笔</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Notifications Toast -->
    <div class="fixed top-6 right-6 z-[200] space-y-3 pointer-events-none w-full max-w-sm">
      <TransitionGroup 
        enter-active-class="transform transition ease-out duration-300"
        enter-from-class="translate-y-[-20px] translate-x-[20px] opacity-0"
        enter-to-class="translate-y-0 translate-x-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div 
          v-for="n in store.notifications" 
          :key="n.id"
          class="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 rounded-2xl flex items-start gap-4 group"
        >
          <div 
            class="p-2.5 rounded-xl shrink-0 shadow-sm"
            :class="{
              'bg-emerald-100 text-emerald-600': n.type === 'success',
              'bg-rose-100 text-rose-600': n.type === 'error',
              'bg-amber-100 text-amber-600': n.type === 'warning',
              'bg-blue-100 text-blue-600': n.type === 'info'
            }"
          >
            <component :is="n.type === 'success' ? Check : (n.type === 'error' ? X : AlertCircle)" :size="20" stroke-width="2.5" />
          </div>
          <div class="flex-1 pt-0.5">
            <h4 class="text-sm font-bold text-slate-800 leading-tight">{{ n.type === 'success' ? '操作成功' : (n.type === 'error' ? '操作失败' : '系统提示') }}</h4>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ n.message }}</p>
          </div>
          <button @click="store.removeNotification(n.id)" class="text-slate-300 hover:text-slate-500 p-1 hover:bg-slate-50 rounded-lg transition-colors">
            <X :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div class="flex p-1 bg-white rounded-xl border border-slate-200 w-fit">
          <button 
            v-for="type in ['all', 'year', 'month', 'day']" 
            :key="type"
            @click="store.filterType = type"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-all"
            :class="store.filterType === type ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'"
          >
            {{ {all: '全部', year: '按年', month: '按月', day: '按日'}[type] }}
          </button>
        </div>

        <div v-if="store.filterType !== 'all'" class="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200">
          <button @click="navigateFilter('prev')" class="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronLeft :size="20" />
          </button>
          <div class="flex items-center gap-2 min-w-[120px] justify-center">
            <CalendarIcon :size="18" class="text-primary-500" />
            <span class="font-bold text-slate-700">{{ filterLabel }}</span>
          </div>
          <button @click="navigateFilter('next')" class="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>

      <!-- Tag Filters -->
      <div v-if="store.allTags.length > 0" class="flex flex-wrap items-center gap-2 mb-8 p-3 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
        <div class="flex items-center gap-1.5 text-slate-400 text-xs font-medium px-2 py-1 border-r border-slate-100 mr-1">
          <TagIcon :size="14" />
          <span>标签筛选:</span>
        </div>
        
        <div class="flex flex-wrap gap-2 flex-1">
          <button 
            v-for="tag in store.allTags" 
            :key="tag"
            @click="store.toggleTagFilter(tag)"
            class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
            :class="store.selectedTags.includes(tag) 
              ? 'bg-primary-600 text-white shadow-sm ring-2 ring-primary-100' 
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-100'"
          >
            <Hash :size="12" />
            {{ tag }}
          </button>
        </div>

        <button 
          v-if="store.selectedTags.length > 0"
          @click="store.clearTagFilters"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
        >
          <X :size="14" />
          <span>清空筛选</span>
        </button>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="当前余额" 
          :amount="store.balance" 
          type="balance"
          :icon="Wallet"
        />
        <StatsCard 
          title="总收入" 
          :amount="store.totalIncome" 
          type="income"
          :icon="TrendingUp"
        />
        <StatsCard 
          title="总支出" 
          :amount="store.totalExpense" 
          type="expense"
          :icon="TrendingDown"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Transaction List -->
        <div class="lg:col-span-2">
          <TransactionList @edit="handleEdit" />
        </div>

        <!-- Right Panel (e.g., Quick Actions or Summary) -->
        <div class="space-y-6">
          <!-- Accounts Card -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Wallet :size="20" class="text-primary-500" />
                我的账户
              </h2>
              <button 
                @click="showAccountManager = true"
                class="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1.5 rounded-lg transition-all"
              >
                管理账户
              </button>
            </div>
            
            <div class="space-y-4">
              <div 
                v-for="acc in store.accounts" 
                :key="acc.id"
                class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-100 transition-all"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-primary-600 shadow-sm">
                    <component :is="getAccountIcon(acc.icon)" :size="20" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700">{{ acc.name }}</p>
                    <p class="text-[10px] text-slate-400">{{ acc.type === 'cash' ? '现金账户' : '电子钱包' }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-900">¥{{ store.accountBalances[acc.id]?.toFixed(2) || '0.00' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Budget Card -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-slate-800">月度预算</h2>
              <button @click="showBudgetSetter = true" class="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary-600 transition-colors">
                <Settings :size="18" />
              </button>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-end justify-between">
                <div>
                  <p class="text-xs text-slate-500 mb-1">{{ format(store.filterDate, 'MM月') }}已支出</p>
                  <p class="text-2xl font-bold text-slate-900">¥{{ store.currentMonthExpense.toFixed(2) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-slate-500 mb-1">预算 ¥{{ store.currentMonthBudget.toFixed(2) }}</p>
                  <p class="text-sm font-medium" :class="store.isOverBudget ? 'text-rose-500' : 'text-slate-600'">
                    {{ store.currentMonthBudget > 0 ? (store.isOverBudget ? '已超支' : '剩余 ¥' + (store.currentMonthBudget - store.currentMonthExpense).toFixed(2)) : '未设置预算' }}
                  </p>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-500"
                  :class="store.isOverBudget ? 'bg-rose-500' : (store.budgetProgress > 80 ? 'bg-amber-500' : 'bg-primary-500')"
                  :style="{ width: `${Math.min(store.budgetProgress, 100)}%` }"
                ></div>
              </div>
              
              <!-- Warning Message -->
              <div v-if="store.isOverBudget" class="flex items-start gap-2 p-3 bg-rose-50 rounded-xl text-rose-600 text-xs">
                <AlertCircle :size="16" class="shrink-0" />
                <p>警报：您本月的支出已超出预算，建议适当控制非必要消费。</p>
              </div>
              <div v-else-if="store.budgetProgress > 80" class="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-amber-600 text-xs">
                <AlertCircle :size="16" class="shrink-0" />
                <p>提示：本月预算已使用超过80%，请注意后续支出。</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <LayoutGrid :size="20" class="text-primary-500" />
                分类管理
              </h2>
              <button 
                @click="showCategoryManager = true"
                class="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1.5 rounded-lg transition-all"
              >
                编辑分类
              </button>
            </div>
            <CategoryChart />
          </div>

          <!-- Recurring Transactions Panel -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Repeat :size="20" class="text-primary-500" />
                周期账单
              </h2>
              <button 
                @click="showRecurringForm = true"
                class="p-2 hover:bg-slate-50 rounded-lg text-primary-600 transition-colors"
                title="添加周期账单"
              >
                <Plus :size="18" />
              </button>
            </div>
            
            <div class="space-y-3">
              <div v-if="store.recurringTransactions.length === 0" class="text-center py-6">
                <p class="text-slate-400 text-sm">暂无周期账单</p>
              </div>
              <div 
                v-for="rt in store.recurringTransactions" 
                :key="rt.id"
                class="group p-3 rounded-xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-slate-700">{{ rt.description }}</span>
                  <div class="flex items-center gap-2">
                    <span :class="rt.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'" class="font-bold">
                      {{ rt.type === 'expense' ? '-' : '+' }}¥{{ rt.amount }}
                    </span>
                    <button 
                      @click="store.deleteRecurringTransaction(rt.id)"
                      class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-400">
                  <span class="bg-slate-100 px-1.5 py-0.5 rounded uppercase">{{ rt.frequency }}</span>
                  <span>下次执行: {{ format(new Date(rt.nextDate), 'MM-dd') }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-2xl text-white shadow-lg shadow-primary-200">
            <h3 class="font-bold text-lg mb-2">坚持记账，</h3>
            <p class="text-primary-100 text-sm leading-relaxed">
              清晰的收支记录是理财的第一步。继续保持这个好习惯！
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Form -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeForm"></div>
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-slate-800">{{ editingTransaction ? '修改账单' : '记一笔' }}</h2>
            <button @click="closeForm" class="text-slate-400 hover:text-slate-600 p-1">
              <X :size="24" />
            </button>
          </div>
          <TransactionForm :initial-data="editingTransaction" @success="handleFormSuccess" />
        </div>
      </div>
    </div>

    <!-- Budget Setter Modal -->
    <div v-if="showBudgetSetter" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showBudgetSetter = false"></div>
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
        <div class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-slate-800">设置预算</h2>
            <button @click="showBudgetSetter = false" class="text-slate-400 hover:text-slate-600 p-1">
              <X :size="20" />
            </button>
          </div>
          <BudgetSetter @success="showBudgetSetter = false" />
        </div>
      </div>
    </div>

    <!-- Category Manager Modal -->
    <div v-if="showCategoryManager" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="showCategoryManager = false"></div>
      <div class="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <!-- Modal Header (Fixed) -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between bg-white border-b border-slate-50 relative z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
              <LayoutGrid :size="20" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">分类管理</h2>
              <p class="text-xs text-slate-400 mt-0.5">自定义您的收支类别</p>
            </div>
          </div>
          <button @click="showCategoryManager = false" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X :size="20" class="text-slate-400" />
          </button>
        </div>
        
        <!-- Modal Content (Scrollable) -->
        <div class="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <CategoryManager />
        </div>
      </div>
    </div>

    <!-- Account Manager Modal -->
    <div v-if="showAccountManager" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="showAccountManager = false"></div>
      <div class="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <!-- Modal Header (Fixed) -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between bg-white border-b border-slate-50 relative z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
              <Wallet :size="20" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">账户管理</h2>
              <p class="text-xs text-slate-400 mt-0.5">管理您的资产账户与初始余额</p>
            </div>
          </div>
          <button @click="showAccountManager = false" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X :size="20" class="text-slate-400" />
          </button>
        </div>
        
        <!-- Modal Content (Scrollable) -->
        <div class="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <AccountManager @close="showAccountManager = false" />
        </div>
      </div>
    </div>

    <!-- Recurring Transaction Modal -->
    <RecurringTransactionForm 
      v-if="showRecurringForm" 
      @close="showRecurringForm = false"
      @success="showRecurringForm = false"
    />
  </div>
</template>
