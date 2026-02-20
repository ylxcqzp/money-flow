<script setup>
/**
 * 仪表盘页面 Dashboard.vue
 * 项目主入口页面，包含收支统计、账单列表、账户管理、预算设置等核心功能
 */
import { useTransactionStore } from '../stores/transaction'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import StatsCard from '../components/StatsCard.vue'
import TransactionForm from '../components/TransactionForm.vue'
import TransactionList from '../components/TransactionList.vue'
import CategoryChart from '../components/CategoryChart.vue'
import BudgetSetter from '../components/BudgetSetter.vue'
import RecurringTransactionForm from '../components/RecurringTransactionForm.vue'
import CategoryManager from '../components/CategoryManager.vue'
import AccountManager from '../components/AccountManager.vue'
import GoalsManager from '../components/GoalsManager.vue'
import { Wallet, TrendingUp, TrendingDown, Plus, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Settings, AlertCircle, Repeat, Trash2, CreditCard, Smartphone, MessageCircle, LayoutGrid, Tag as TagIcon, Hash, Check, BarChart3, PieChart, Target, Scale, BellRing, RefreshCw, LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { ref, computed, onMounted, watch } from 'vue'
import { format, addYears, addMonths, addDays, subYears, subMonths, subDays } from 'date-fns'
import { Loader2 } from 'lucide-vue-next'
import { ElMessageBox } from 'element-plus'

const store = useTransactionStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

// 弹窗显示状态控制
const showForm = ref(false)              // 记账表单弹窗
const showBudgetSetter = ref(false)      // 预算设置弹窗
const showRecurringForm = ref(false)     // 周期账单表单弹窗
const showCategoryManager = ref(false)   // 分类管理弹窗
const showAccountManager = ref(false)    // 账户管理弹窗
const showGoalsManager = ref(false)      // 储蓄目标弹窗
const showUserMenu = ref(false)          // 用户菜单显示状态
const editingTransaction = ref(null)     // 当前正在编辑的交易对象
const deletingRecurringId = ref(null)    // 正在删除的周期账单ID
const isLoggingOut = ref(false)          // 正在退出登录

// 监听所有弹窗状态，控制 body 滚动锁定
const isAnyModalOpen = computed(() => 
  showForm.value || 
  showBudgetSetter.value || 
  showRecurringForm.value || 
  showCategoryManager.value || 
  showAccountManager.value || 
  showGoalsManager.value
)

watch(isAnyModalOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

/**
 * 退出登录
 */
const handleLogout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await authStore.logout()
    router.push('/login')
  } finally {
    isLoggingOut.value = false
  }
}

onMounted(() => {
  // 初始化数据
  if (!store.isInitialized) {
    store.initData()
  }
  
  // 检查汇率更新
  const lastUpdate = store.lastExchangeRateUpdate
  const oneDay = 24 * 60 * 60 * 1000
  if (!lastUpdate || (new Date() - new Date(lastUpdate)) > oneDay) {
    store.fetchExchangeRates()
  }
})

/**
 * 格式化汇率更新时间
 */
const lastExchangeRateUpdateLabel = computed(() => {
  if (!store.lastExchangeRateUpdate) return '从未更新'
  return format(new Date(store.lastExchangeRateUpdate), 'MM-dd HH:mm')
})

/**
 * 处理编辑交易操作
 * @param {Object} transaction 交易对象
 */
const handleEdit = (transaction) => {
  editingTransaction.value = transaction
  showForm.value = true
}

/**
 * 账单提交成功后的回调
 */
const handleFormSuccess = () => {
  showForm.value = false
  editingTransaction.value = null
}

/**
 * 关闭记账表单弹窗
 */
const closeForm = () => {
  showForm.value = false
  editingTransaction.value = null
}

/**
 * 过滤日期显示标签
 * 根据当前的过滤类型（年/月/日）返回对应的日期格式
 */
const filterLabel = computed(() => {
  if (store.filterType === 'year') return format(store.filterDate, 'yyyy年')
  if (store.filterType === 'month') return format(store.filterDate, 'yyyy年MM月')
  if (store.filterType === 'day') return format(store.filterDate, 'yyyy年MM月dd日')
  return '全部记录'
})

/**
 * 导航切换过滤日期
 * @param {'prev' | 'next'} direction 切换方向：上一个/下一个
 */
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

/**
 * 根据图标名称获取账户图标组件
 * @param {string} iconName 图标名称
 */
const getAccountIcon = (iconName) => {
  const icons = {
    Wallet,
    CreditCard,
    Smartphone,
    MessageCircle
  }
  return icons[iconName] || Wallet
}

/**
 * 处理删除周期性账单
 */
const handleDeleteRecurring = async (id) => {
  if (deletingRecurringId.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这条周期性账单规则吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    deletingRecurringId.value = id
    await store.deleteRecurringTransaction(id)
  } catch (e) {
    // cancelled
  } finally {
    deletingRecurringId.value = null
  }
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

          <!-- User Profile Dropdown -->
          <div class="relative ml-2" v-if="authStore.user">
            <button 
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition-all"
            >
              <span class="text-xs font-medium text-slate-700 ml-1 hidden sm:block">{{ authStore.user.name }}</span>
              <img :src="authStore.user.avatar" alt="User" class="w-8 h-8 rounded-full bg-slate-100 object-cover" />
            </button>
            
            <div v-if="showUserMenu" class="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div class="px-4 py-3 border-b border-slate-50">
                <p class="text-xs text-slate-500">登录账号</p>
                <p class="text-sm font-bold text-slate-800 truncate">{{ authStore.user.email }}</p>
              </div>
              <button 
                @click="handleLogout"
                :disabled="isLoggingOut"
                class="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="isLoggingOut" class="animate-spin" :size="16" />
                <LogOut v-else :size="16" />
                {{ isLoggingOut ? '退出中...' : '退出登录' }}
              </button>
            </div>
            
            <!-- Click outside handler overlay -->
            <div v-if="showUserMenu" @click="showUserMenu = false" class="fixed inset-0 z-40 bg-transparent cursor-default"></div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
          <button 
            @click="showGoalsManager = true"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-all text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Target :size="16" />
            目标追踪
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
          title="本月结余" 
          :amount="store.currentMonthBalance" 
          :type="store.currentMonthBalance >= 0 ? 'income' : 'expense'"
          :icon="Scale"
          :sub-text="store.filterType === 'all' ? '当前月份' : ''"
        />
        <StatsCard 
          title="储蓄率" 
          :amount="store.savingsRate" 
          type="rate"
          :is-percent="true"
          :icon="PieChart"
          :progress="store.savingsRate"
          :sub-text="store.currentMonthIncome > 0 ? '结余/收入' : '暂无收入'"
        />
        <StatsCard 
          title="预算完成度" 
          :amount="store.budgetProgress" 
          type="expense"
          :is-percent="true"
          :icon="Target"
          :progress="store.budgetProgress"
          :sub-text="store.isOverBudget ? '已超支' : '预算内'"
          tooltip-position="right"
        >
          <template v-if="store.currentMonthCategoryBudgets.length > 0" #tooltip>
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                分类预算进度
                <span class="text-[10px] bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full border border-primary-500/30">详细</span>
              </h4>
              <div class="space-y-2.5">
                <div v-for="cb in store.currentMonthCategoryBudgets" :key="cb.id" class="space-y-1">
                  <div class="flex items-center justify-between text-[10px] font-bold">
                    <span class="text-slate-300">{{ cb.name }}</span>
                    <span :class="cb.isOver ? 'text-rose-400' : 'text-slate-400'">{{ Math.round(cb.progress) }}%</span>
                  </div>
                  <div class="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      class="h-full transition-all duration-500"
                      :class="cb.isOver ? 'bg-rose-500' : 'bg-primary-500'"
                      :style="{ width: `${Math.min(cb.progress, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </StatsCard>
      </div>

      <!-- 预算复盘与分析 -->
      <div v-if="store.budgetReviewSuggestions.length > 0" class="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden relative group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          
          <h3 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
            <div class="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
              <AlertCircle :size="14" />
            </div>
            预算复盘建议
          </h3>
          
          <div class="space-y-3 relative z-10">
            <div 
              v-for="(suggestion, index) in store.budgetReviewSuggestions" 
              :key="index"
              class="flex items-start gap-3 p-3 rounded-2xl border transition-all"
              :class="{
                'bg-rose-50 border-rose-100 text-rose-700': suggestion.type === 'danger',
                'bg-amber-50 border-amber-100 text-amber-700': suggestion.type === 'warning',
                'bg-blue-50 border-blue-100 text-blue-700': suggestion.type === 'info'
              }"
            >
              <component 
                :is="suggestion.type === 'danger' ? X : (suggestion.type === 'warning' ? AlertCircle : Check)" 
                :size="16" 
                class="mt-0.5 shrink-0" 
              />
              <p class="text-xs font-medium leading-relaxed">{{ suggestion.message }}</p>
            </div>
          </div>
        </div>

        <div v-if="store.currentMonthCategoryBudgets.length > 0" class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 class="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <LayoutGrid :size="14" />
            </div>
            分类预算执行
          </h3>
          
          <div class="space-y-4">
            <div v-for="cb in store.currentMonthCategoryBudgets" :key="cb.id" class="space-y-2">
              <div class="flex items-center justify-between text-xs font-bold">
                <div class="flex items-center gap-2 text-slate-600">
                  <span>{{ cb.name }}</span>
                  <span v-if="cb.isOver" class="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-full">超支</span>
                </div>
                <div class="text-slate-400">
                  <span class="text-slate-700">¥{{ cb.spent.toFixed(0) }}</span> / ¥{{ cb.limit.toFixed(0) }}
                </div>
              </div>
              <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-1000"
                  :class="cb.isOver ? 'bg-rose-500' : (cb.progress > 80 ? 'bg-amber-500' : 'bg-primary-500')"
                  :style="{ width: `${Math.min(cb.progress, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Historical Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="当前总余额" 
          :amount="store.balance" 
          type="balance"
          :icon="Wallet"
        />
        <StatsCard 
          title="筛选收入" 
          :amount="store.totalIncome" 
          type="income"
          :icon="TrendingUp"
        />
        <StatsCard 
          title="筛选支出" 
          :amount="store.totalExpense" 
          type="expense"
          :icon="TrendingDown"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Transaction List -->
        <div class="lg:col-span-2">
          <TransactionList @edit="handleEdit" @add="showForm = true" />
        </div>

        <!-- Right Panel (e.g., Quick Actions or Summary) -->
        <div class="space-y-6">
          
          <!-- 1. Assets Card -->
          <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Wallet :size="20" class="text-primary-500" />
                我的账户
              </h2>
              <div class="flex items-center gap-2">
                <button 
                  @click="store.fetchExchangeRates" 
                  class="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-primary-600 transition-colors" 
                  :title="'汇率更新于: ' + lastExchangeRateUpdateLabel"
                  :disabled="store.isFetchingRates"
                >
                  <RefreshCw :size="16" :class="{ 'animate-spin': store.isFetchingRates }" />
                </button>
                <button 
                  @click="showAccountManager = true"
                  class="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  管理
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div 
                v-for="acc in store.accounts" 
                :key="acc.id"
                class="relative group rounded-2xl p-4 transition-all duration-300 border border-slate-100 bg-slate-50 hover:-translate-y-1 hover:shadow-md hover:bg-white hover:border-primary-200 cursor-pointer"
                @click="showAccountManager = true"
              >
                <!-- Top Row -->
                <div class="flex justify-between items-start mb-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-white text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                    <component :is="getAccountIcon(acc.icon)" :size="20" />
                  </div>
                  <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-white text-slate-500 border border-slate-100">
                    {{ acc.type === 'cash' ? '现金' : '账户' }}
                  </span>
                </div>
                
                <!-- Bottom Info -->
                <div>
                  <p class="text-xs font-medium text-slate-500 mb-0.5 truncate">{{ acc.name }}</p>
                  <p class="text-lg font-bold tracking-tight truncate text-slate-900">
                    ¥{{ store.accountBalances[acc.id]?.toFixed(2) || '0.00' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Budget & Analysis Card -->
          <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
            <!-- Budget Section -->
            <div class="mb-8">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <PieChart :size="20" class="text-primary-500" />
                  月度预算
                </h2>
                <button @click="showBudgetSetter = true" class="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-primary-600 transition-colors">
                  <Settings :size="16" />
                </button>
              </div>
              
              <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div class="flex items-end justify-between mb-3">
                  <div>
                    <p class="text-xs text-slate-500 mb-1">本月支出</p>
                    <p class="text-xl font-bold text-slate-900">¥{{ store.currentMonthExpense.toFixed(2) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-slate-500 mb-1">剩余额度</p>
                    <p class="text-sm font-bold" :class="store.isOverBudget ? 'text-rose-500' : 'text-emerald-500'">
                      {{ store.currentMonthBudget > 0 ? (store.isOverBudget ? '已超支' : '¥' + (store.currentMonthBudget - store.currentMonthExpense).toFixed(2)) : '--' }}
                    </p>
                  </div>
                </div>

                <div class="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div 
                    class="h-full transition-all duration-1000 ease-out rounded-full"
                    :class="store.isOverBudget ? 'bg-rose-500' : (store.budgetProgress > 80 ? 'bg-amber-500' : 'bg-primary-500')"
                    :style="{ width: `${Math.min(store.budgetProgress, 100)}%` }"
                  ></div>
                </div>
                
                <p v-if="store.isOverBudget" class="text-[10px] text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle :size="10" />
                  超出预算，请注意控制支出
                </p>
              </div>
            </div>

            <!-- Category Chart Section -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-slate-700">消费构成</h3>
                <button 
                  @click="showCategoryManager = true"
                  class="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg transition-all"
                >
                  管理分类
                </button>
              </div>
              <CategoryChart />
            </div>
          </div>

          <!-- 3. Planning Card (Recurring & Goals) -->
          <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
            <!-- Recurring Section -->
            <div class="mb-8">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Repeat :size="20" class="text-primary-500" />
                  周期账单
                </h2>
                <button 
                  @click="showRecurringForm = true"
                  class="p-2 hover:bg-slate-50 rounded-xl text-primary-600 transition-colors"
                >
                  <Plus :size="16" />
                </button>
              </div>
              
              <div class="space-y-3">
                <div v-if="store.recurringTransactions.length === 0" class="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p class="text-slate-400 text-xs">暂无周期账单</p>
                </div>
                <div 
                  v-for="rt in store.recurringTransactions" 
                  :key="rt.id"
                  class="group relative flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-xs">
                      {{ rt.frequency === 'monthly' ? '月' : (rt.frequency === 'weekly' ? '周' : '年') }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800">{{ rt.description }}</p>
                      <p class="text-[10px] text-slate-400">下次: {{ rt.nextExecutionDate && !isNaN(new Date(rt.nextExecutionDate).getTime()) ? format(new Date(rt.nextExecutionDate), 'MM-dd') : '待定' }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold" :class="rt.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'">
                      {{ rt.type === 'expense' ? '-' : '+' }}¥{{ rt.amount }}
                    </p>
                    <button 
                      @click="handleDeleteRecurring(rt.id)"
                      class="absolute -top-2 -right-2 p-1.5 bg-white shadow-sm border border-slate-100 rounded-full text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                    >
                      <Trash2 :size="12" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Goals Section -->
            <div v-if="store.goals.length > 0">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Target :size="20" class="text-primary-500" />
                  储蓄目标
                </h2>
                <button 
                  @click="showGoalsManager = true"
                  class="p-2 hover:bg-slate-50 rounded-xl text-primary-600 transition-colors"
                >
                  <ChevronRight :size="16" />
                </button>
              </div>
              <div class="space-y-3">
                <div v-for="goal in store.goals.slice(0, 2)" :key="goal.id" class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div class="flex items-center justify-between text-xs font-bold mb-2">
                    <span class="text-slate-700">{{ goal.name }}</span>
                    <span class="text-primary-600">{{ Math.round((goal.currentAmount / goal.targetAmount) * 100) }}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-1000"
                      :style="{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Form -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showForm" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" @click="closeForm"></div>
      </Transition>
      <Transition name="modal">
        <div v-if="showForm" class="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl relative overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto">
            <!-- Header - 固定在顶部 -->
            <div class="px-6 py-4 border-b border-slate-50 flex items-center justify-between shrink-0">
              <h2 class="text-xl font-bold text-slate-800">{{ editingTransaction ? '修改账单' : '记一笔' }}</h2>
              <button @click="closeForm" class="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-colors">
                <X :size="24" />
              </button>
            </div>
            
            <!-- Content - 包含可滚动表单 -->
            <div class="px-6 pb-6 pt-2 overflow-hidden flex-1 flex flex-col">
              <TransactionForm :initial-data="editingTransaction" @success="handleFormSuccess" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Budget Setter Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showBudgetSetter" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" @click="showBudgetSetter = false"></div>
      </Transition>
      <Transition name="modal">
        <div v-if="showBudgetSetter" class="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden pointer-events-auto">
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
      </Transition>
    </Teleport>

    <!-- Category Manager Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCategoryManager" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]" @click="showCategoryManager = false"></div>
      </Transition>
      <Transition name="modal">
        <div v-if="showCategoryManager" class="fixed inset-0 z-[111] flex items-center justify-center p-4 pointer-events-none">
          <div class="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto">
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
            <div class="flex-1 overflow-hidden flex flex-col">
              <CategoryManager class="h-full" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Account Manager Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAccountManager" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]" @click="showAccountManager = false"></div>
      </Transition>
      <Transition name="modal">
        <div v-if="showAccountManager" class="fixed inset-0 z-[111] flex items-center justify-center p-4 pointer-events-none">
          <div class="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto">
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
      </Transition>
    </Teleport>

    <!-- Goals Manager Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showGoalsManager" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]" @click="showGoalsManager = false"></div>
      </Transition>
      <Transition name="modal">
        <div v-if="showGoalsManager" class="fixed inset-0 z-[111] flex items-center justify-center p-4 pointer-events-none">
          <div class="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto">
            <!-- Modal Header (Fixed) -->
            <div class="px-8 pt-8 pb-4 flex items-center justify-between bg-white border-b border-slate-50 relative z-10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                  <Target :size="20" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-slate-800">储蓄目标追踪</h2>
                  <p class="text-xs text-slate-400 mt-0.5">为梦想攒下每一分钱</p>
                </div>
              </div>
              <button @click="showGoalsManager = false" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X :size="20" class="text-slate-400" />
              </button>
            </div>
            
            <!-- Modal Content (Scrollable) -->
            <div class="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
              <GoalsManager />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Recurring Transaction Modal -->
    <RecurringTransactionForm 
      v-if="showRecurringForm" 
      @close="showRecurringForm = false"
      @success="showRecurringForm = false"
    />
  </div>
</template>
