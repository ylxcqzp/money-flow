import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { 
  startOfYear, startOfMonth, startOfDay, 
  endOfYear, endOfMonth, endOfDay,
  isSameYear, isSameMonth, isSameDay,
  addDays, addWeeks, addMonths, addYears,
  isBefore, parseISO, format
} from 'date-fns'
import transactionApi from '@/api/transaction'
import accountApi from '@/api/account'
import categoryApi from '@/api/category'
import budgetApi from '@/api/budget'
import goalApi from '@/api/goal'
import recurringApi from '@/api/recurring'
import { useNotificationStore } from './notification'

/**
 * 交易状态管理仓库 (Pinia Store)
 * 负责处理所有的账单数据、账户信息、分类设置、预算以及周期性任务
 */
export const useTransactionStore = defineStore('transaction', () => {
  // --- 响应式状态 (State) ---
  
  // 交易列表 (当前筛选条件下的)
  const transactions = ref([])
  
  // 预算配置 (当前月份)
  const currentBudget = ref({ total: 0, categories: {} })
  
  // 周期性账单配置列表
  const recurringTransactions = ref([])
  
  // 储蓄目标列表
  const goals = ref([])
  
  // 多币种支持：汇率数据
  const exchangeRates = ref({ "CNY": 1, "USD": 0.14, "EUR": 0.13, "JPY": 20.5, "HKD": 1.09 })
  const baseCurrency = ref('CNY')
  const lastExchangeRateUpdate = ref(localStorage.getItem('lastExchangeRateUpdate') || '')
  const isFetchingRates = ref(false)

  // 用户账户列表
  const accounts = ref([])

  // 账单分类列表
  const categories = ref([])
  
  // 当前选中的标签筛选列表
  const selectedTags = ref([])

  // 筛选配置：类型 (年/月/日/全部) 和 基准日期
  const filterType = ref('month') // 默认为月
  const filterDate = ref(new Date())

  // 排序配置
  const sortConfig = ref({
    key: 'date',
    order: 'desc'
  })
  
  // 加载状态
  const loading = ref(false)
  const isInitialized = ref(false)
  let initPromise = null

  // 通知 store
  const notificationStore = useNotificationStore()

  // --- 初始化与数据获取 ---

  /**
   * 初始化数据
   * 加载账户、分类、目标、周期性规则、交易记录和预算
   * 包含防重逻辑，避免重复请求
   * @param {boolean} force 是否强制重新加载
   */
  async function initData(force = false) {
    if (isInitialized.value && !force) return
    if (initPromise && !force) return initPromise
    
    loading.value = true
    
    initPromise = (async () => {
      try {
        await Promise.all([
          fetchAccounts(),
          fetchCategories(),
          fetchGoals(),
          fetchRecurringRules()
        ])
        // 初始加载交易记录
        await fetchTransactions()
        // 初始加载预算
        await fetchBudget()
        
        isInitialized.value = true
      } catch (error) {
        console.error('Init data error:', error)
      } finally {
        loading.value = false
        initPromise = null
      }
    })()
    
    return initPromise
  }

  async function fetchAccounts() {
    const res = await accountApi.getAccounts()
    accounts.value = res.data || res
  }

  async function fetchCategories() {
    try {
      const res = await categoryApi.getCategories()
      categories.value = res.data || res || []
    } catch (error) {
      console.error('Fetch categories error:', error)
      categories.value = []
    }
  }

  async function fetchGoals() {
    const res = await goalApi.getGoals()
    goals.value = res.data || res
  }

  async function fetchRecurringRules() {
    const res = await recurringApi.getRules()
    recurringTransactions.value = res.data || res
  }

  async function fetchBudget() {
    const month = format(filterDate.value, 'yyyy-MM')
    try {
      const res = await budgetApi.getBudget(month)
      currentBudget.value = res.data || res || { total: 0, categories: {} }
    } catch (e) {
      currentBudget.value = { total: 0, categories: {} }
    }
  }

  async function fetchTransactions() {
    loading.value = true
    try {
      const params = {
        type: 'all' // 后端接口可能需要此参数，或不传查所有
      }
      
      // 构建日期范围
      const d = filterDate.value
      if (filterType.value === 'year') {
        params.startDate = format(startOfYear(d), 'yyyy-MM-dd')
        params.endDate = format(endOfYear(d), 'yyyy-MM-dd')
      } else if (filterType.value === 'month') {
        params.startDate = format(startOfMonth(d), 'yyyy-MM-dd')
        params.endDate = format(endOfMonth(d), 'yyyy-MM-dd')
      } else if (filterType.value === 'day') {
        params.startDate = format(startOfDay(d), 'yyyy-MM-dd')
        params.endDate = format(endOfDay(d), 'yyyy-MM-dd')
      }
      
      // 标签筛选
      if (selectedTags.value.length > 0) {
        params.tags = selectedTags.value.join(',')
      }

      const res = await transactionApi.getTransactions(params)
      transactions.value = res.data || res
    } catch (error) {
      console.error('Fetch transactions error:', error)
      transactions.value = []
    } finally {
      loading.value = false
    }
  }

  // 监听筛选条件变化，重新获取数据
  watch([filterType, filterDate, selectedTags], () => {
    fetchTransactions()
    if (filterType.value === 'month') {
      fetchBudget()
    }
  })

  // --- 计算属性 (Getters) ---

  /**
   * 根据本地排序配置处理后的交易记录
   * (后端可能已排序，这里做二次排序或确保顺序)
   */
  const filteredTransactions = computed(() => {
    let list = transactions.value
    if (selectedTags.value.length > 0) {
      list = list.filter(t => {
        const tagList = Array.isArray(t.tags) ? t.tags : (t.tags ? t.tags.split(',') : [])
        return selectedTags.value.every(tag => tagList.includes(tag))
      })
    }
    return [...list].sort((a, b) => {
      const { key, order } = sortConfig.value
      let comparison = 0

      if (key === 'date') {
        comparison = new Date(a.date) - new Date(b.date)
      } else if (key === 'amount') {
        comparison = Number(a.amount) - Number(b.amount)
      } else if (key === 'category') {
        const catA = findCategoryById(a.categoryId)?.name || ''
        const catB = findCategoryById(b.categoryId)?.name || ''
        comparison = catA.localeCompare(catB, 'zh-CN')
      }

      return order === 'desc' ? -comparison : comparison
    })
  })

  const allTags = computed(() => {
    // 由于是分页或过滤后的数据，这里的 tags 可能不全。
    // 理想情况应该有一个单独的 API 获取所有 tags，或者从当前数据聚合
    const tags = new Set()
    transactions.value.forEach(t => {
      if (t.tags) {
         // 假设 tags 是数组，如果是逗号分隔字符串需处理
         const tagList = Array.isArray(t.tags) ? t.tags : (t.tags ? t.tags.split(',') : [])
         tagList.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  })

  const totalIncome = computed(() => {
    return transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  const totalExpense = computed(() => {
    return transactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  // 账户余额：直接使用从后端获取的 accounts 中的 balance 字段
  // 如果后端 accounts 包含实时余额
  const accountBalances = computed(() => {
    const balances = {}
    accounts.value.forEach(acc => {
      // 假设后端返回的 account 对象包含 balance 字段 (计算后的)
      // 如果只有 initialBalance，那需要后端提供余额接口
      // 这里暂时假设后端 accounts 列表已经包含了计算好的 currentBalance
      balances[acc.id] = Number(acc.currentBalance || acc.balance || acc.initialBalance || 0)
    })
    return balances
  })

  const balance = computed(() => {
    return Object.values(accountBalances.value).reduce((sum, bal) => sum + bal, 0)
  })

  const currentMonthKey = computed(() => {
    const d = filterDate.value
    return format(d, 'yyyy-MM')
  })

  const currentMonthBudget = computed(() => {
    return currentBudget.value.total || 0
  })

  const currentMonthCategoryExpenses = computed(() => {
    const expenses = {}
    transactions.value
      .filter(t => t.type === 'expense') // 假设 transactions 已经是当前月份的数据(当filterType为month时)
      .forEach(t => {
        const catId = t.categoryId
        if (catId) {
          expenses[catId] = (expenses[catId] || 0) + Number(t.amount)
        }
      })
    return expenses
  })

  const currentMonthCategoryBudgets = computed(() => {
    const budgetData = currentBudget.value
    if (!budgetData || !budgetData.categories) return []

    const result = []
    for (const [catId, limit] of Object.entries(budgetData.categories)) {
      const category = findCategoryById(catId)
      if (!category) continue

      const spent = currentMonthCategoryExpenses.value[catId] || 0
      result.push({
        id: catId,
        name: category.name,
        icon: category.icon,
        limit,
        spent,
        progress: limit > 0 ? (spent / limit) * 100 : 0,
        remaining: limit - spent,
        isOver: spent > limit
      })
    }
    return result
  })

  const budgetReviewSuggestions = computed(() => {
    const suggestions = []
    if (budgetProgress.value > 100) {
      suggestions.push({
        type: 'danger',
        message: `本月总支出已超出预算 ${(budgetProgress.value - 100).toFixed(1)}%，请注意控制非必要支出。`
      })
    } else if (budgetProgress.value > 80) {
      suggestions.push({
        type: 'warning',
        message: '本月总预算已使用超过 80%，接下来的日子建议勤俭节约。'
      })
    }
    // ... 其他建议逻辑同理 ...
    return suggestions
  })

  const currentMonthExpense = computed(() => totalExpense.value)
  const currentMonthIncome = computed(() => totalIncome.value)
  const currentMonthBalance = computed(() => currentMonthIncome.value - currentMonthExpense.value)

  const savingsRate = computed(() => {
    if (currentMonthIncome.value <= 0) return 0
    const rate = (currentMonthBalance.value / currentMonthIncome.value) * 100
    return Math.max(0, rate)
  })

  const budgetProgress = computed(() => {
    if (currentMonthBudget.value === 0) return 0
    return (currentMonthExpense.value / currentMonthBudget.value) * 100
  })

  const isOverBudget = computed(() => {
    return currentMonthBudget.value > 0 && currentMonthExpense.value > currentMonthBudget.value
  })

  // --- 业务动作 (Actions) ---

  async function fetchExchangeRates() {
    // 保持原有逻辑，或也改为后端代理
    if (isFetchingRates.value) return
    isFetchingRates.value = true
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency.value}`)
      const data = await response.json()
      if (data.result === 'success') {
        exchangeRates.value = data.rates
        lastExchangeRateUpdate.value = new Date().toISOString()
        localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates.value))
        localStorage.setItem('lastExchangeRateUpdate', lastExchangeRateUpdate.value)
        notificationStore.success('汇率数据已更新')
      }
    } catch (error) {
      // 这里的 fetch 是原生请求，不受拦截器控制，可以保留提示，但建议改写为统一方式
      notificationStore.error('获取汇率数据失败，请检查网络')
    } finally {
      isFetchingRates.value = false
    }
  }

  function convertAmount(amount, fromCurrency, toCurrency = baseCurrency.value) {
    if (fromCurrency === toCurrency) return amount
    const rateToSource = exchangeRates.value[fromCurrency]
    const rateToTarget = exchangeRates.value[toCurrency]
    if (!rateToSource || !rateToTarget) return amount
    return Number((amount / rateToSource * rateToTarget).toFixed(2))
  }

  function toggleTagFilter(tag) {
    const index = selectedTags.value.indexOf(tag)
    if (index === -1) selectedTags.value.push(tag)
    else selectedTags.value.splice(index, 1)
  }

  function clearTagFilters() {
    selectedTags.value = []
  }

  async function addRecurringTransaction(recurring) {
    try {
      await recurringApi.createRule(recurring)
      await fetchRecurringRules()
      notificationStore.success('周期性账单规则已添加')
      return true
    } catch (e) {
      return false
    }
  }


  async function deleteRecurringTransaction(id) {
    try {
      await recurringApi.deleteRule(id)
      await fetchRecurringRules()
      notificationStore.success('规则已删除')
      return true
    } catch (e) {
      return false
    }
  }

  async function addTransaction(transaction) {
    try {
      await transactionApi.createTransaction(transaction)
      await fetchTransactions()
      await fetchAccounts() // 余额可能变化
      notificationStore.success('交易已记录')
      return true
    } catch (e) {
      return false
    }
  }

  async function updateTransaction(id, updatedData) {
    try {
      await transactionApi.updateTransaction(id, updatedData)
      await fetchTransactions()
      await fetchAccounts()
      notificationStore.success('交易已更新')
      return true
    } catch (e) {
      return false
    }
  }

  async function deleteTransaction(id) {
    try {
      await transactionApi.deleteTransaction(id)
      await fetchTransactions()
      await fetchAccounts()
      notificationStore.success('交易已删除')
      return true
    } catch (e) {
      return false
    }
  }

  async function addAccount(account) {
    try {
      await accountApi.createAccount(account)
      await fetchAccounts()
      notificationStore.success('账户已添加')
      return true
    } catch (e) {
      return false
    }
  }

  async function updateAccount(id, updatedData) {
    try {
      await accountApi.updateAccount(id, updatedData)
      await fetchAccounts()
      notificationStore.success('账户已更新')
      return true
    } catch (e) {
      return false
    }
  }

  async function deleteAccount(id) {
    try {
      await accountApi.deleteAccount(id)
      await fetchAccounts()
      notificationStore.success('账户已删除')
      return true
    } catch (e) {
      return false
    }
  }

  async function addCategory(category, parentId = null) {
    try {
      await categoryApi.createCategory({ ...category, parentId })
      await fetchCategories()
      notificationStore.success('分类已添加')
      return true
    } catch (e) {
      return false
    }
  }

  async function updateCategory(id, updatedData) {
    try {
      await categoryApi.updateCategory(id, updatedData)
      await fetchCategories()
      notificationStore.success('分类已更新')
      return true
    } catch (e) {
      return false
    }
  }

  async function deleteCategory(id) {
    try {
      await categoryApi.deleteCategory(id)
      await fetchCategories()
      notificationStore.success('分类已删除')
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * 根据ID查找分类（递归查找）
   * @param {string|number} id 分类ID
   * @param {Array} list 分类列表
   */
  function findCategoryById(id, list = categories.value) {
    if (id === null || id === undefined || id === '') return null
    if (!Array.isArray(list)) return null

    const targetId = String(id)
    for (const item of list) {
      if (item && String(item.id) === targetId) return item
      if (item && item.children && Array.isArray(item.children) && item.children.length > 0) {
        const found = findCategoryById(id, item.children)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 查找分类及其父分类
   * @param {string|number} id 分类ID
   * @param {Array} list 分类列表
   * @param {Object} parent 当前父分类
   */
  function findCategoryWithParent(id, list = categories.value, parent = null) {
    if (id === null || id === undefined || id === '') return { category: null, parent: null }
    
    const targetId = String(id)
    for (const item of list) {
      if (item && String(item.id) === targetId) {
        return { category: item, parent: parent }
      }
      if (item && item.children && Array.isArray(item.children) && item.children.length > 0) {
        const found = findCategoryWithParent(id, item.children, item)
        if (found && found.category) return found
      }
    }
    return { category: null, parent: null }
  }

  async function setBudget(monthKey, budgetData) {
    try {
      await budgetApi.saveBudget({ month: monthKey, ...budgetData })
      await fetchBudget() // 重新获取预算
      notificationStore.success('预算已设置')
      return true
    } catch (e) {
      return false
    }
  }

  async function addGoal(goal) {
    try {
      await goalApi.createGoal(goal)
      await fetchGoals()
      notificationStore.success('目标已添加')
      return true
    } catch (e) {
      return false
    }
  }

  async function updateGoalProgress(id, amount) {
    try {
      // 这里的逻辑需要调用后端接口记录流水
      await goalApi.addGoalRecord(id, { 
        amount, 
        operateDate: format(new Date(), 'yyyy-MM-dd') 
      })
      await fetchGoals()
      notificationStore.success('进度已更新')
      return true
    } catch (e) {
      return false
    }
  }

  async function deleteGoal(id) {
    try {
      await goalApi.deleteGoal(id)
      await fetchGoals()
      notificationStore.success('目标已删除')
      return true
    } catch (e) {
      return false
    }
  }

  function setSort(key) {
    if (sortConfig.value.key === key) {
      sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc'
    } else {
      sortConfig.value.key = key
      sortConfig.value.order = 'desc'
    }
  }

  const categoryRankings = computed(() => {
    const expenses = filteredTransactions.value.filter(t => t.type === 'expense')
    const rankingMap = {}
    let totalSpending = 0

    expenses.forEach(t => {
      const catId = t.categoryId
      if (!catId) return

      if (!rankingMap[catId]) {
        const category = findCategoryById(catId)
        rankingMap[catId] = {
          id: catId,
          name: category?.name || '其他',
          icon: category?.icon || 'HelpCircle',
          amount: 0,
          count: 0
        }
      }

      const amount = Number(t.amount)
      rankingMap[catId].amount += amount
      rankingMap[catId].count += 1
      totalSpending += amount
    })

    return Object.values(rankingMap)
      .map(item => ({
        ...item,
        percentage: totalSpending > 0 ? (item.amount / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
  })

  return {
    // 状态
    transactions,
    filteredTransactions,
    currentBudget, // renamed from budgets to currentBudget to reflect it's mostly one month
    budgets: currentBudget, // alias for compatibility if needed
    filterType,
    filterDate,
    sortConfig,
    loading,
    isInitialized,
    
    // 计算属性
    totalIncome,
    totalExpense,
    categoryRankings,
    balance,
    currentMonthBudget,
    currentMonthCategoryExpenses,
    currentMonthCategoryBudgets,
    budgetReviewSuggestions,
    currentMonthExpense,
    currentMonthIncome,
    currentMonthBalance,
    savingsRate,
    budgetProgress,
    isOverBudget,
    currentMonthKey,
    accounts,
    accountBalances,
    categories,
    recurringTransactions,
    goals,
    selectedTags,
    allTags,
    exchangeRates,
    baseCurrency,
    lastExchangeRateUpdate,
    isFetchingRates,
    
    // Actions
    initData, // New Action
    addTransaction,
    updateTransaction,
    deleteTransaction,
    fetchExchangeRates,
    convertAmount,
    setSort,
    
    setBudget,
    addRecurringTransaction,
    deleteRecurringTransaction,
    
    addAccount,
    updateAccount,
    deleteAccount,
    
    addCategory,
    updateCategory,
    deleteCategory,
    findCategoryById,
    findCategoryWithParent,
    toggleTagFilter,
    clearTagFilters,
    
    addGoal,
    updateGoalProgress,
    deleteGoal,
    
    // 通知桥接 (兼容旧组件)
    addNotification: notificationStore.addNotification,
    success: notificationStore.success,
    error: notificationStore.error,
    warning: notificationStore.warning,
    info: notificationStore.info
  }
})
