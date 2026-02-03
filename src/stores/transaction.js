import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { 
  startOfYear, startOfMonth, startOfDay, 
  isSameYear, isSameMonth, isSameDay,
  addDays, addWeeks, addMonths, addYears,
  isBefore, parseISO, format
} from 'date-fns'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref(JSON.parse(localStorage.getItem('transactions') || '[]'))
  const budgets = ref(JSON.parse(localStorage.getItem('budgets') || '{}')) // Format: { '2026-02': 5000 }
  const recurringTransactions = ref(JSON.parse(localStorage.getItem('recurringTransactions') || '[]'))
  
  // Account state
  const defaultAccounts = [
    { id: '1', name: '现金', type: 'cash', icon: 'Wallet', initialBalance: 0 },
    { id: '2', name: '银行卡', type: 'card', icon: 'CreditCard', initialBalance: 0 },
    { id: '3', name: '支付宝', type: 'alipay', icon: 'Smartphone', initialBalance: 0 },
    { id: '4', name: '微信支付', type: 'wechat', icon: 'MessageCircle', initialBalance: 0 }
  ]
  const accounts = ref(JSON.parse(localStorage.getItem('accounts') || JSON.stringify(defaultAccounts)))

  // Categories state
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
    { id: 'exp_entertainment', name: '娱乐', type: 'expense', icon: 'Gamepad2' },
    { id: 'inc_salary', name: '工资', type: 'income', icon: 'Banknote' },
    { id: 'inc_bonus', name: '奖金', type: 'income', icon: 'Trophy' },
    { id: 'inc_invest', name: '投资收益', type: 'income', icon: 'TrendingUp' }
  ]
  const categories = ref(JSON.parse(localStorage.getItem('categories') || JSON.stringify(defaultCategories)))
  const selectedTags = ref([])

  // Filter state
  const filterType = ref('all') // 'year', 'month', 'day', 'all'
  const filterDate = ref(new Date())

  const filteredTransactions = computed(() => {
    return transactions.value.filter(t => {
      // Date filter
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

      // Tag filter (AND logic: transaction must have all selected tags)
      if (selectedTags.value.length > 0) {
        if (!t.tags || t.tags.length === 0) return false
        return selectedTags.value.every(tag => t.tags.includes(tag))
      }

      return true
    })
  })

  // All available tags from all transactions
  const allTags = computed(() => {
    const tags = new Set()
    transactions.value.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  })

  function toggleTagFilter(tag) {
    const index = selectedTags.value.indexOf(tag)
    if (index === -1) {
      selectedTags.value.push(tag)
    } else {
      selectedTags.value.splice(index, 1)
    }
  }

  function clearTagFilters() {
    selectedTags.value = []
  }

  // Recurring logic
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

  function checkAndGenerateRecurring() {
    const today = new Date()
    let generatedCount = 0

    recurringTransactions.value.forEach(rt => {
      let nextDate = parseISO(rt.nextDate)
      
      while (isBefore(nextDate, today) || isSameDay(nextDate, today)) {
        // Generate transaction
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

        // Calculate next date
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

  function deleteRecurringTransaction(id) {
    recurringTransactions.value = recurringTransactions.value.filter(rt => rt.id !== id)
    saveRecurring()
  }

  function saveRecurring() {
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions.value))
  }

  const totalIncome = computed(() => {
    return filteredTransactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  const totalExpense = computed(() => {
    return filteredTransactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  // Account balances
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
        // Internal transfer: subtract from source, add to target
        const fromId = t.fromAccountId
        const toId = t.toAccountId
        if (balances[fromId] !== undefined) balances[fromId] -= amount
        if (balances[toId] !== undefined) balances[toId] += amount
      }
    })
    return balances
  })

  const balance = computed(() => {
    return Object.values(accountBalances.value).reduce((sum, bal) => sum + bal, 0)
  })

  // Budget logic
  const currentMonthKey = computed(() => {
    const d = filterDate.value
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const currentMonthBudget = computed(() => budgets.value[currentMonthKey.value] || 0)

  const currentMonthExpense = computed(() => {
    return transactions.value
      .filter(t => t.type === 'expense' && isSameMonth(new Date(t.date), filterDate.value))
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })

  const budgetProgress = computed(() => {
    if (currentMonthBudget.value === 0) return 0
    return (currentMonthExpense.value / currentMonthBudget.value) * 100
  })

  const isOverBudget = computed(() => {
    return currentMonthBudget.value > 0 && currentMonthExpense.value > currentMonthBudget.value
  })

  // Notifications
  const notifications = ref([])

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

  function removeNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  function addTransaction(transaction) {
    transactions.value.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      accountId: transaction.accountId || '1',
      ...transaction
    })
    saveTransactions()
  }

  function addAccount(account) {
    accounts.value.push({
      id: Date.now().toString(),
      ...account
    })
    saveAccounts()
  }

  function updateAccount(id, updatedData) {
    const index = accounts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      accounts.value[index] = { ...accounts.value[index], ...updatedData }
      // Trigger reactivity for nested changes and save
      accounts.value = [...accounts.value]
      saveAccounts()
    }
  }

  function deleteAccount(id) {
    // Check if there are transactions linked to this account
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

  function saveAccounts() {
    localStorage.setItem('accounts', JSON.stringify(accounts.value))
  }

  // Category Actions
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

  function updateCategory(id, updatedData) {
    const cat = findCategoryById(id)
    if (cat) {
      Object.assign(cat, updatedData)
      saveCategories()
    }
  }

  function deleteCategory(id) {
    // Check if being used by transactions
    const isUsed = transactions.value.some(t => t.categoryId === id || t.subCategoryId === id)
    if (isUsed) {
      addNotification('该分类已被交易记录使用，无法删除', 'error')
      return false
    }

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

  function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories.value))
  }

  function updateTransaction(id, updatedData) {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value[index] = { ...transactions.value[index], ...updatedData }
      saveTransactions()
    }
  }

  function deleteTransaction(id) {
    transactions.value = transactions.value.filter(t => t.id !== id)
    saveTransactions()
  }

  function setBudget(monthKey, amount) {
    budgets.value[monthKey] = amount
    saveBudgets()
  }

  function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions.value))
  }

  function saveBudgets() {
    localStorage.setItem('budgets', JSON.stringify(budgets.value))
  }

  return {
    transactions,
    filteredTransactions,
    budgets,
    filterType,
    filterDate,
    totalIncome,
    totalExpense,
    balance,
    currentMonthBudget,
    currentMonthExpense,
    budgetProgress,
    isOverBudget,
    currentMonthKey,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudget,
    recurringTransactions,
    addRecurringTransaction,
    checkAndGenerateRecurring,
    deleteRecurringTransaction,
    notifications,
    addNotification,
    removeNotification,
    accounts,
    accountBalances,
    addAccount,
    updateAccount,
    deleteAccount,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    findCategoryById,
    selectedTags,
    allTags,
    toggleTagFilter,
    clearTagFilters
  }
})
