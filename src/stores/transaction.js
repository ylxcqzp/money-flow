import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { 
  startOfYear, startOfMonth, startOfDay, 
  isSameYear, isSameMonth, isSameDay,
  addDays, addWeeks, addMonths, addYears,
  isBefore, parseISO, format
} from 'date-fns'

/**
 * 交易状态管理仓库 (Pinia Store)
 * 负责处理所有的账单数据、账户信息、分类设置、预算以及周期性任务
 */
export const useTransactionStore = defineStore('transaction', () => {
  // --- 响应式状态 (State) ---
  
  // 账单记录列表，初始化从本地存储读取
  const transactions = ref(JSON.parse(localStorage.getItem('transactions') || '[]'))
  
  // 预算配置，格式为 { 'yyyy-MM': { total: 金额, categories: { categoryId: 金额 } } }
  const budgets = ref(JSON.parse(localStorage.getItem('budgets') || '{}'))
  
  // 周期性账单配置列表
  const recurringTransactions = ref(JSON.parse(localStorage.getItem('recurringTransactions') || '[]'))
  
  // 储蓄目标列表
  const goals = ref(JSON.parse(localStorage.getItem('goals') || '[]'))
  
  // 多币种支持：汇率数据
  const exchangeRates = ref(JSON.parse(localStorage.getItem('exchangeRates') || '{"CNY": 1, "USD": 0.14, "EUR": 0.13, "JPY": 20.5, "HKD": 1.09}'))
  const baseCurrency = ref('CNY')
  const lastExchangeRateUpdate = ref(localStorage.getItem('lastExchangeRateUpdate') || '')

  // 默认账户配置
  const defaultAccounts = [
    { id: '1', name: '现金', type: 'cash', icon: 'Wallet', initialBalance: 0 },
    { id: '2', name: '银行卡', type: 'card', icon: 'CreditCard', initialBalance: 0 },
    { id: '3', name: '支付宝', type: 'alipay', icon: 'Smartphone', initialBalance: 0 },
    { id: '4', name: '微信支付', type: 'wechat', icon: 'MessageCircle', initialBalance: 0 }
  ]
  // 用户账户列表，优先从本地存储读取
  const accounts = ref(JSON.parse(localStorage.getItem('accounts') || JSON.stringify(defaultAccounts)))

  // 默认分类配置 (支出与收入)
  const defaultCategories = [
    { id: 'exp_dining', name: '餐饮', type: 'expense', icon: 'Utensils', children: [
      { id: 'exp_dining_out', name: '外卖', type: 'expense', icon: 'Bike' },
      { id: 'exp_dining_restaurant', name: '下馆子', type: 'expense', icon: 'ChefHat' },
      { id: 'exp_dining_cafe', name: '咖啡饮料', type: 'expense', icon: 'Coffee' }
    ]},
    { id: 'exp_transport', name: '交通', type: 'expense', icon: 'Car', children: [
      { id: 'exp_transport_bus', name: '公交地铁', type: 'expense', icon: 'Bus' },
      { id: 'exp_transport_taxi', name: '打车', type: 'expense', icon: 'CarTaxiFront' },
      { id: 'exp_transport_fuel', name: '加油', type: 'expense', icon: 'Fuel' }
    ]},
    { id: 'exp_shopping', name: '购物', type: 'expense', icon: 'ShoppingBag', children: [
      { id: 'exp_shopping_daily', name: '日用品', type: 'expense', icon: 'Store' },
      { id: 'exp_shopping_clothes', name: '衣服鞋包', type: 'expense', icon: 'Shirt' }
    ]},
    { id: 'exp_medical', name: '医疗', type: 'expense', icon: 'HeartPulse', children: [
      { id: 'exp_medical_medicine', name: '药品', type: 'expense', icon: 'Sparkles' },
      { id: 'exp_medical_hospital', name: '挂号住院', type: 'expense', icon: 'Home' }
    ]},
    { id: 'exp_education', name: '教育', type: 'expense', icon: 'GraduationCap', children: [
      { id: 'exp_education_course', name: '课程培训', type: 'expense', icon: 'GraduationCap' },
      { id: 'exp_education_book', name: '书刊报纸', type: 'expense', icon: 'GraduationCap' }
    ]},
    { id: 'exp_social', name: '人情', type: 'expense', icon: 'Gift', children: [
      { id: 'exp_social_gift', name: '送礼', type: 'expense', icon: 'Gift' },
      { id: 'exp_social_redpacket', name: '红包', type: 'expense', icon: 'Gift' }
    ]},
    { id: 'exp_housing', name: '居住', type: 'expense', icon: 'Home', children: [
      { id: 'exp_housing_rent', name: '房租房贷', type: 'expense', icon: 'Key' },
      { id: 'exp_housing_utility', name: '水电煤气', type: 'expense', icon: 'Zap' },
      { id: 'exp_housing_property', name: '物业维修', type: 'expense', icon: 'Wrench' }
    ]},
    { id: 'exp_work', name: '工作', type: 'expense', icon: 'Briefcase', children: [
      { id: 'exp_work_tool', name: '办公用品', type: 'expense', icon: 'PenTool' },
      { id: 'exp_work_business', name: '出差公干', type: 'expense', icon: 'Plane' }
    ]},
    { id: 'exp_entertainment', name: '娱乐', type: 'expense', icon: 'Gamepad2', children: [
      { id: 'exp_entertainment_movie', name: '电影演出', type: 'expense', icon: 'Ticket' },
      { id: 'exp_entertainment_game', name: '游戏充值', type: 'expense', icon: 'Gamepad2' },
      { id: 'exp_entertainment_hobby', name: '休闲爱好', type: 'expense', icon: 'Camera' }
    ]},
    { id: 'exp_digital', name: '数码订阅', type: 'expense', icon: 'Cpu', children: [
      { id: 'exp_digital_device', name: '手机电脑', type: 'expense', icon: 'Smartphone' },
      { id: 'exp_digital_sub', name: '软件订阅', type: 'expense', icon: 'Cloud' },
      { id: 'exp_digital_service', name: '网络服务', type: 'expense', icon: 'Wifi' }
    ]},
    { id: 'exp_pets', name: '宠物', type: 'expense', icon: 'Dog', children: [
      { id: 'exp_pets_food', name: '宠物主食', type: 'expense', icon: 'Bone' },
      { id: 'exp_pets_medical', name: '宠物医疗', type: 'expense', icon: 'HeartPulse' },
      { id: 'exp_pets_toy', name: '宠物零食', type: 'expense', icon: 'ToyBrick' }
    ]},
    { id: 'exp_beauty', name: '美妆护肤', type: 'expense', icon: 'Sparkles', children: [
      { id: 'exp_beauty_hair', name: '理发美发', type: 'expense', icon: 'Scissors' },
      { id: 'exp_beauty_cosmetic', name: '化妆品', type: 'expense', icon: 'Sparkles' },
      { id: 'exp_beauty_skincare', name: '护肤品', type: 'expense', icon: 'Droplets' }
    ]},
    { id: 'exp_fitness', name: '运动健身', type: 'expense', icon: 'Dumbbell', children: [
      { id: 'exp_fitness_gym', name: '健身房', type: 'expense', icon: 'Dumbbell' },
      { id: 'exp_fitness_equipment', name: '运动装备', type: 'expense', icon: 'Footprints' }
    ]},
    { id: 'exp_other', name: '其他支出', type: 'expense', icon: 'MoreHorizontal' },
    { id: 'inc_salary', name: '工资', type: 'income', icon: 'Banknote' },
    { id: 'inc_bonus', name: '奖金', type: 'income', icon: 'Trophy' },
    { id: 'inc_invest', name: '投资收益', type: 'income', icon: 'TrendingUp', children: [
      { id: 'inc_invest_stock', name: '股票', type: 'income', icon: 'LineChart' },
      { id: 'inc_invest_fund', name: '基金', type: 'income', icon: 'PieChart' }
    ]},
    { id: 'inc_secondhand', name: '二手交易', type: 'income', icon: 'RotateCcw' },
    { id: 'inc_other', name: '其他收入', type: 'income', icon: 'MoreHorizontal' }
  ]
  // 账单分类列表，支持层级结构
  const categories = ref(JSON.parse(localStorage.getItem('categories') || JSON.stringify(defaultCategories)))
  
  // 当前选中的标签筛选列表
  const selectedTags = ref([])

  // 筛选配置：类型 (年/月/日/全部) 和 基准日期
  const filterType = ref('all') 
  const filterDate = ref(new Date())

  // 排序配置：key 为排序字段，order 为排序顺序 (asc/desc)
  const sortConfig = ref({
    key: 'date',
    order: 'desc'
  })

  // --- 计算属性 (Getters) ---

  /**
   * 根据当前筛选条件和排序配置处理后的交易记录
   */
  const filteredTransactions = computed(() => {
    let result = transactions.value.filter(t => {
      // 日期匹配逻辑
      const tDate = new Date(t.date)
      let dateMatch = true
      if (filterType.value === 'year') {
        dateMatch = isSameYear(tDate, filterDate.value)
      } else if (filterType.value === 'month') {
        dateMatch = isSameMonth(tDate, filterDate.value)
      } else if (filterType.value === 'day') {
        dateMatch = isSameDay(tDate, filterDate.value)
      }

      if (!dateMatch) return false

      // 标签筛选逻辑 (交集逻辑：记录必须包含所有选中的标签)
      if (selectedTags.value.length > 0) {
        if (!t.tags || t.tags.length === 0) return false
        return selectedTags.value.every(tag => t.tags.includes(tag))
      }

      return true
    })

    // 应用排序逻辑
    return [...result].sort((a, b) => {
      const { key, order } = sortConfig.value
      let comparison = 0

      if (key === 'date') {
        comparison = new Date(a.date) - new Date(b.date)
      } else if (key === 'amount') {
        comparison = Number(a.amount) - Number(b.amount)
      } else if (key === 'category') {
        // 获取分类名称进行比较
        const catA = findCategoryById(a.subCategoryId || a.categoryId)?.name || ''
        const catB = findCategoryById(b.subCategoryId || b.categoryId)?.name || ''
        comparison = catA.localeCompare(catB, 'zh-CN')
      }

      return order === 'desc' ? -comparison : comparison
    })
  })

  /**
   * 从所有交易记录中提取出的唯一标签集合
   */
  const allTags = computed(() => {
    const tags = new Set()
    transactions.value.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  })

  /**
   * 计算筛选后交易的总收入
   */
  const totalIncome = computed(() => {
    return filteredTransactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  /**
   * 计算筛选后交易的总支出
   */
  const totalExpense = computed(() => {
    return filteredTransactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  /**
   * 计算每个账户的当前余额 (初始余额 + 收入 - 支出)
   */
  const accountBalances = computed(() => {
    const balances = {}
    accounts.value.forEach(acc => {
      balances[acc.id] = Number(acc.initialBalance || 0)
    })

    transactions.value.forEach(t => {
      const amount = Number(t.amount)
      if (t.type === 'income') {
        const accId = t.accountId || '1'
        if (balances[accId] !== undefined) balances[accId] += amount
      } else if (t.type === 'expense') {
        const accId = t.accountId || '1'
        if (balances[accId] !== undefined) balances[accId] -= amount
      } else if (t.type === 'transfer') {
        // 内部转账：转出账户减，转入账户加
        const fromId = t.fromAccountId
        const toId = t.toAccountId
        if (balances[fromId] !== undefined) balances[fromId] -= amount
        if (balances[toId] !== undefined) balances[toId] += amount
      }
    })
    return balances
  })

  /**
   * 计算所有账户的总余额
   */
  const balance = computed(() => {
    return Object.values(accountBalances.value).reduce((sum, bal) => sum + bal, 0)
  })

  /**
   * 当前筛选日期对应的月份 Key (用于预算查询)
   */
  const currentMonthKey = computed(() => {
    const d = filterDate.value
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  /**
   * 获取当前月份的总预算金额
   */
  const currentMonthBudget = computed(() => {
    const budget = budgets.value[currentMonthKey.value]
    if (!budget) return 0
    // 如果是旧数据格式（直接是数字），则返回该数字
    if (typeof budget === 'number') return budget
    return budget.total || 0
  })

  /**
   * 获取当前月份各分类的支出统计
   */
  const currentMonthCategoryExpenses = computed(() => {
    const expenses = {}
    transactions.value
      .filter(t => t.type === 'expense' && isSameMonth(new Date(t.date), filterDate.value))
      .forEach(t => {
        const catId = t.categoryId
        if (catId) {
          expenses[catId] = (expenses[catId] || 0) + Number(t.amount)
        }
      })
    return expenses
  })

  /**
   * 获取当前月份各分类的预算执行情况
   */
  const currentMonthCategoryBudgets = computed(() => {
    const budgetData = budgets.value[currentMonthKey.value]
    if (!budgetData || typeof budgetData === 'number' || !budgetData.categories) return []

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

  /**
   * 预算复盘建议：基于当前预算执行情况生成分析建议
   */
  const budgetReviewSuggestions = computed(() => {
    const suggestions = []
    
    // 1. 检查总预算
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

    // 2. 检查分类预算
    currentMonthCategoryBudgets.value.forEach(cb => {
      if (cb.isOver) {
        const overPercent = ((cb.spent - cb.limit) / cb.limit * 100).toFixed(0)
        suggestions.push({
          type: 'danger',
          message: `“${cb.name}”分类已超支 ${overPercent}%，建议分析该类目是否存在不合理开支。`,
          categoryId: cb.id
        })
      } else if (cb.progress > 90) {
        suggestions.push({
          type: 'warning',
          message: `“${cb.name}”分类预算即将用尽，请合理安排剩余额度。`,
          categoryId: cb.id
        })
      }
    })

    // 3. 储蓄率建议
    if (savingsRate.value < 10 && currentMonthIncome.value > 0) {
      suggestions.push({
        type: 'info',
        message: '本月储蓄率偏低，建议减少娱乐或购物等非刚性支出以增加积蓄。'
      })
    }

    return suggestions
  })

  /**
   * 计算当前月份的总支出 (用于预算对比)
   */
  const currentMonthExpense = computed(() => {
    return transactions.value
      .filter(t => t.type === 'expense' && isSameMonth(new Date(t.date), filterDate.value))
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  /**
   * 计算当前月份的总收入
   */
  const currentMonthIncome = computed(() => {
    return transactions.value
      .filter(t => t.type === 'income' && isSameMonth(new Date(t.date), filterDate.value))
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  /**
   * 计算本月结余 (本月收入 - 本月支出)
   */
  const currentMonthBalance = computed(() => {
    return currentMonthIncome.value - currentMonthExpense.value
  })

  /**
   * 计算储蓄率 (本月结余 / 本月收入)
   */
  const savingsRate = computed(() => {
    if (currentMonthIncome.value <= 0) return 0
    const rate = (currentMonthBalance.value / currentMonthIncome.value) * 100
    return Math.max(0, rate) // 结余为负时储蓄率为0
  })

  /**
   * 计算预算使用百分比进度
   */
  const budgetProgress = computed(() => {
    if (currentMonthBudget.value === 0) return 0
    return (currentMonthExpense.value / currentMonthBudget.value) * 100
  })

  /**
   * 判断是否超出预算
   */
  const isOverBudget = computed(() => {
    return currentMonthBudget.value > 0 && currentMonthExpense.value > currentMonthBudget.value
  })

  // 系统通知列表
  const notifications = ref([])

  // --- 业务动作 (Actions) ---

  /**
   * 获取最新汇率数据 (调用 exchangerate-api)
   */
  async function fetchExchangeRates() {
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency.value}`)
      const data = await response.json()
      
      if (data.result === 'success') {
        exchangeRates.value = data.rates
        lastExchangeRateUpdate.value = new Date().toISOString()
        saveExchangeRates()
        addNotification('汇率数据已更新', 'success')
      } else {
        throw new Error('获取汇率失败')
      }
    } catch (error) {
      console.error('Fetch exchange rates error:', error)
      addNotification('获取汇率失败，请检查网络连接', 'error')
    }
  }

  /**
   * 货币转换
   * @param {number} amount 金额
   * @param {string} fromCurrency 源币种
   * @param {string} toCurrency 目标币种 (默认为本币)
   * @returns {number} 转换后的金额
   */
  function convertAmount(amount, fromCurrency, toCurrency = baseCurrency.value) {
    if (fromCurrency === toCurrency) return amount
    
    // 如果没有源币种汇率，尝试使用默认比例或返回原金额
    const rateToSource = exchangeRates.value[fromCurrency]
    const rateToTarget = exchangeRates.value[toCurrency]
    
    if (!rateToSource || !rateToTarget) return amount
    
    // 逻辑：金额 / (源币种对基准的汇率) * (目标币种对基准的汇率)
    // 注意：exchangerate-api 返回的是 1 Base = X Currency
    // 所以转换公式是：Amount / RateFrom * RateTo
    // 但如果 baseCurrency 就是 CNY，那么 RateToSource 就是 1 USD = X CNY 这种形式
    // 实际上 API 返回的是以 baseCurrency 为基准的各币种汇率
    // 例如 base=CNY, rates={USD: 0.14, HKD: 1.09}
    // 转换公式：Amount (USD) / 0.14 = Amount (CNY)
    return Number((amount / rateToSource * rateToTarget).toFixed(2))
  }

  /**
   * 切换标签筛选状态
   * @param {string} tag 标签名称
   */
  function toggleTagFilter(tag) {
    const index = selectedTags.value.indexOf(tag)
    if (index === -1) {
      selectedTags.value.push(tag)
    } else {
      selectedTags.value.splice(index, 1)
    }
  }

  /**
   * 清除所有标签筛选
   */
  function clearTagFilters() {
    selectedTags.value = []
  }

  /**
   * 添加周期性账单配置
   * @param {Object} recurring 周期性账单配置对象
   */
  function addRecurringTransaction(recurring) {
    recurringTransactions.value.push({
      id: Date.now(),
      lastGeneratedDate: null,
      nextDate: recurring.startDate,
      ...recurring
    })
    saveRecurring()
    checkAndGenerateRecurring()
  }

  /**
   * 检查并自动生成周期性账单记录
   * 遍历所有配置，如果当前时间超过了下次执行时间，则生成对应的交易记录
   */
  function checkAndGenerateRecurring() {
    const today = new Date()
    let generatedCount = 0

    recurringTransactions.value.forEach(rt => {
      let nextDate = parseISO(rt.nextDate)
      
      while (isBefore(nextDate, today) || isSameDay(nextDate, today)) {
        // 生成实际的交易记录
        transactions.value.unshift({
          id: Date.now() + Math.random(),
          date: rt.nextDate,
          description: rt.description,
          amount: rt.amount,
          type: rt.type,
          categoryId: rt.categoryId,
          subCategoryId: rt.subCategoryId,
          accountId: rt.accountId || '1',
          isRecurring: true,
          recurringId: rt.id
        })
        
        addNotification(`周期账单 "${rt.description}" 已自动生成记录`, 'success')

        // 根据频率计算下次执行时间
        rt.lastGeneratedDate = rt.nextDate
        let newNextDate
        if (rt.frequency === 'daily') newNextDate = addDays(nextDate, 1)
        else if (rt.frequency === 'weekly') newNextDate = addWeeks(nextDate, 1)
        else if (rt.frequency === 'monthly') newNextDate = addMonths(nextDate, 1)
        else if (rt.frequency === 'yearly') newNextDate = addYears(nextDate, 1)
        
        rt.nextDate = newNextDate.toISOString()
        nextDate = newNextDate
        generatedCount++
      }
    })

    if (generatedCount > 0) {
      saveTransactions()
      saveRecurring()
    }
  }

  /**
   * 删除周期性账单配置
   * @param {number|string} id 配置ID
   */
  function deleteRecurringTransaction(id) {
    recurringTransactions.value = recurringTransactions.value.filter(rt => rt.id !== id)
    saveRecurring()
  }

  /**
   * 添加系统通知
   * @param {string} message 消息内容
   * @param {string} type 通知类型 (success, error, info, warning)
   */
  function addNotification(message, type = 'info') {
    const id = Date.now()
    notifications.value.push({
      id,
      message,
      type,
      timestamp: new Date().toISOString()
    })
    
    // 3秒后自动移除通知
    setTimeout(() => {
      removeNotification(id)
    }, 3000)
  }

  /**
   * 手动移除系统通知
   * @param {number} id 通知ID
   */
  function removeNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  /**
   * 添加一笔新交易
   * @param {Object} transaction 交易数据
   */
  function addTransaction(transaction) {
    transactions.value.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      accountId: transaction.accountId || '1',
      ...transaction
    })
    saveTransactions()
  }

  /**
   * 添加新账户
   * @param {Object} account 账户数据
   */
  function addAccount(account) {
    accounts.value.push({
      id: Date.now().toString(),
      ...account
    })
    saveAccounts()
  }

  /**
   * 更新账户信息
   * @param {string} id 账户ID
   * @param {Object} updatedData 更新的数据
   */
  function updateAccount(id, updatedData) {
    const index = accounts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      accounts.value[index] = { ...accounts.value[index], ...updatedData }
      // 触发响应式更新并保存
      accounts.value = [...accounts.value]
      saveAccounts()
    }
  }

  /**
   * 删除账户
   * @param {string} id 账户ID
   * @returns {boolean} 是否删除成功
   */
  function deleteAccount(id) {
    // 检查是否有交易记录关联到该账户
    const hasTransactions = transactions.value.some(t => 
      t.accountId === id || t.fromAccountId === id || t.toAccountId === id
    )
    if (hasTransactions) {
      addNotification('该账户下已有交易记录，无法删除', 'error')
      return false
    }
    accounts.value = accounts.value.filter(a => a.id !== id)
    saveAccounts()
    return true
  }

  /**
   * 添加新分类
   * @param {Object} category 分类数据
   * @param {string|null} parentId 父分类ID (可选)
   */
  function addCategory(category, parentId = null) {
    const newCat = {
      id: Date.now().toString(),
      ...category
    }
    if (parentId) {
      const parent = findCategoryById(parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(newCat)
      }
    } else {
      categories.value.push(newCat)
    }
    saveCategories()
  }

  /**
   * 更新分类信息
   * @param {string} id 分类ID
   * @param {Object} updatedData 更新的数据
   */
  function updateCategory(id, updatedData) {
    const cat = findCategoryById(id)
    if (cat) {
      Object.assign(cat, updatedData)
      saveCategories()
    }
  }

  /**
   * 删除分类
   * @param {string} id 分类ID
   * @returns {boolean} 是否删除成功
   */
  function deleteCategory(id) {
    // 检查是否有交易记录关联到该分类
    const isUsed = transactions.value.some(t => t.categoryId === id || t.subCategoryId === id)
    if (isUsed) {
      addNotification('该分类已被交易记录使用，无法删除', 'error')
      return false
    }

    // 递归查找并移除分类节点
    const removeNode = (list) => {
      const index = list.findIndex(item => item.id === id)
      if (index !== -1) {
        list.splice(index, 1)
        return true
      }
      for (const item of list) {
        if (item.children && removeNode(item.children)) return true
      }
      return false
    }

    removeNode(categories.value)
    saveCategories()
    return true
  }

  /**
   * 根据 ID 递归查找分类
   * @param {string} id 分类ID
   * @param {Array} list 分类列表
   * @returns {Object|null} 找到的分类对象
   */
  function findCategoryById(id, list = categories.value) {
    for (const item of list) {
      if (item.id === id) return item
      if (item.children) {
        const found = findCategoryById(id, item.children)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 更新单条交易记录
   * @param {number|string} id 交易ID
   * @param {Object} updatedData 更新的数据
   */
  function updateTransaction(id, updatedData) {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value[index] = { ...transactions.value[index], ...updatedData }
      saveTransactions()
    }
  }

  /**
   * 删除单条交易记录
   * @param {number|string} id 交易ID
   */
  function deleteTransaction(id) {
    transactions.value = transactions.value.filter(t => t.id !== id)
    saveTransactions()
  }

  /**
   * 设置指定月份的预算
   * @param {string} monthKey 月份 Key (yyyy-MM)
   * @param {Object} budgetData 预算数据 { total: number, categories: { catId: number } }
   */
  function setBudget(monthKey, budgetData) {
    budgets.value[monthKey] = budgetData
    saveBudgets()
  }

  // --- 持久化辅助方法 ---
  
  function saveTransactions() { localStorage.setItem('transactions', JSON.stringify(transactions.value)) }
  function saveBudgets() { localStorage.setItem('budgets', JSON.stringify(budgets.value)) }
  function saveRecurring() { localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions.value)) }
  function saveAccounts() { localStorage.setItem('accounts', JSON.stringify(accounts.value)) }
  function saveCategories() { localStorage.setItem('categories', JSON.stringify(categories.value)) }
  function saveGoals() { localStorage.setItem('goals', JSON.stringify(goals.value)) }
  function saveExchangeRates() {
    localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates.value))
    localStorage.setItem('lastExchangeRateUpdate', lastExchangeRateUpdate.value)
  }

  /**
   * 添加储蓄目标
   * @param {Object} goal 目标数据 { name, targetAmount, icon, color, deadline }
   */
  function addGoal(goal) {
    goals.value.push({
      id: Date.now().toString(),
      currentAmount: 0,
      createdAt: new Date().toISOString(),
      ...goal
    })
    saveGoals()
  }

  /**
   * 更新储蓄目标进度
   * @param {string} id 目标ID
   * @param {number} amount 存入金额 (正数存入，负数取出)
   */
  function updateGoalProgress(id, amount) {
    const goal = goals.value.find(g => g.id === id)
    if (goal) {
      goal.currentAmount = Math.max(0, goal.currentAmount + Number(amount))
      saveGoals()
    }
  }

  /**
   * 删除储蓄目标
   * @param {string} id 目标ID
   */
  function deleteGoal(id) {
    goals.value = goals.value.filter(g => g.id !== id)
    saveGoals()
  }

  /**
   * 设置排序配置
   * @param {string} key 排序字段
   */
  function setSort(key) {
    if (sortConfig.value.key === key) {
      // 如果点击的是当前排序字段，则切换顺序
      sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc'
    } else {
      // 如果点击的是新字段，默认降序
      sortConfig.value.key = key
      sortConfig.value.order = 'desc'
    }
  }

  /**
   * 支出类目排行统计
   * 基于当前筛选后的交易记录，计算每个类目的总支出和笔数
   */
  const categoryRankings = computed(() => {
    // 关键：必须使用 filteredTransactions 确保统计范围与顶部筛选器（年/月/日）完全一致
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

    // 转换为数组并按金额从高到低排序
    return Object.values(rankingMap)
      .map(item => ({
        ...item,
        percentage: totalSpending > 0 ? (item.amount / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
  })

  // 暴露给外部使用的属性和方法
  return {
    // 状态与计算属性
    transactions,
    filteredTransactions,
    budgets,
    filterType,
    filterDate,
    sortConfig,
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
    notifications,
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
    
    // 交易操作
    addTransaction,
    updateTransaction,
    deleteTransaction,
    fetchExchangeRates,
    convertAmount,
    setSort,
    
    // 预算与周期账单
    setBudget,
    addRecurringTransaction,
    checkAndGenerateRecurring,
    deleteRecurringTransaction,
    
    // 通知与账户操作
    addNotification,
    removeNotification,
    addAccount,
    updateAccount,
    deleteAccount,
    
    // 分类与标签操作
    addCategory,
    updateCategory,
    deleteCategory,
    findCategoryById,
    toggleTagFilter,
    clearTagFilters,
    
    // 储蓄目标操作
    addGoal,
    updateGoalProgress,
    deleteGoal
  }
})
