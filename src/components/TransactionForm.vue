<script setup>
/**
 * 交易记录表单组件 TransactionForm.vue
 * 用于新增或编辑支出、收入和转账记录
 */
import { ref, computed, onMounted } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { Check, X, ChevronRight, Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle, Tag as TagIcon, Hash, RefreshCw, Calendar, HeartPulse, GraduationCap, Gift, Home, Sparkles, Key, Zap, Wrench, Briefcase, PenTool, Plane, Ticket, Camera, Cpu, Smartphone, Cloud, Wifi, Dog, Bone, ToyBrick, Scissors, Droplets, Dumbbell, Footprints, MoreHorizontal, LineChart, PieChart, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  initialData: {
    type: Object,
    default: null // 如果传入 initialData，则为编辑模式
  }
})

const emit = defineEmits(['success'])
const store = useTransactionStore()

// 支持的币种列表
const currencies = [
  { code: 'CNY', symbol: '¥', name: '人民币' },
  { code: 'USD', symbol: '$', name: '美元' },
  { code: 'EUR', symbol: '€', name: '欧元' },
  { code: 'JPY', symbol: '¥', name: '日元' },
  { code: 'HKD', symbol: '$', name: '港币' },
  { code: 'GBP', symbol: '£', name: '英镑' }
]

// 获取当前日期字符串 (yyyy-MM-dd)
const getTodayStr = () => new Date().toISOString().split('T')[0]

// 表单响应式状态
const initializeForm = () => {
  if (props.initialData) {
    const { category, parent } = store.findCategoryWithParent(props.initialData.categoryId)
    return { 
      ...props.initialData,
      date: props.initialData.date ? new Date(props.initialData.date).toISOString().split('T')[0] : getTodayStr(),
      currency: props.initialData.currency || store.baseCurrency,
      accountId: props.initialData.accountId || '1',
      fromAccountId: props.initialData.fromAccountId || '1',
      toAccountId: props.initialData.toAccountId || '2',
      categoryId: parent ? parent.id : (props.initialData.categoryId || ''),
      subCategoryId: parent ? props.initialData.categoryId : (props.initialData.subCategoryId || ''),
      tags: props.initialData.tags ? [...props.initialData.tags] : []
    }
  }
  return {
    description: '',
    amount: '',
    date: getTodayStr(),
    currency: store.baseCurrency,
    type: 'expense',
    categoryId: '',
    subCategoryId: '',
    accountId: store.accounts[0]?.id || '1',
    fromAccountId: store.accounts[0]?.id || '1',
    toAccountId: store.accounts[1]?.id || '2',
    tags: []
  }
}

const form = ref(initializeForm())

onMounted(async () => {
  // 挂载时尝试更新汇率（如果长时间未更新）
  const lastUpdate = store.lastExchangeRateUpdate
  const oneDay = 24 * 60 * 60 * 1000
  if (!lastUpdate || (new Date() - new Date(lastUpdate)) > oneDay) {
    store.fetchExchangeRates()
  }
})

/**
 * 计算换算后的本币金额
 */
const convertedAmount = computed(() => {
  if (!form.value.amount || form.value.currency === store.baseCurrency) return null
  return store.convertAmount(Number(form.value.amount), form.value.currency)
})

/**
 * 获取当前币种符号
 */
const currentCurrencySymbol = computed(() => {
  return currencies.find(c => c.code === form.value.currency)?.symbol || '¥'
})

const tagInput = ref('') // 标签输入框内容

/**
 * 添加标签
 */
const addTag = () => {
  const tag = tagInput.value.trim().replace(/^#/, '')
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  tagInput.value = ''
}

/**
 * 移除标签
 * @param {number} index 标签索引
 */
const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}

/**
 * 选择常用标签（快速添加）
 * @param {string} tag 标签名称
 */
const selectQuickTag = (tag) => {
  if (!form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
}

/**
 * 根据交易类型过滤分类列表
 */
const filteredCategories = computed(() => {
  return store.categories.filter(c => c.type === form.value.type)
})

/**
 * 获取当前选中的父分类对象
 */
const selectedCategory = computed(() => {
  return store.findCategoryById(form.value.categoryId)
})

/**
 * 根据名称获取图标组件
 * @param {string} name 图标名称
 */
const getIcon = (name) => {
  const icons = {
    Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HeartPulse, GraduationCap, Gift, Home, Sparkles, Key, Zap, Wrench, Briefcase, PenTool, Plane,
    Ticket, Camera, Cpu, Smartphone, Cloud, Wifi, Dog, Bone, ToyBrick, Scissors, Droplets, Dumbbell, Footprints, MoreHorizontal, LineChart, PieChart, RotateCcw
  }
  return icons[name] || HelpCircle
}

/**
 * 选择父分类
 * @param {string} catId 分类ID
 */
const selectCategory = (catId) => {
  form.value.categoryId = catId
  form.value.subCategoryId = '' // 切换父分类时重置子分类
}

/**
 * 选择子分类
 * @param {string} subCatId 子分类ID
 */
const selectSubCategory = (subCatId) => {
  form.value.subCategoryId = subCatId
}

const formError = ref('')
const isSubmitting = ref(false)

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  formError.value = ''
  
  if (!form.value.amount) {
    formError.value = '请输入金额'
    return
  }
  
  if (form.value.type !== 'transfer' && !form.value.categoryId) {
    formError.value = '请选择一个分类'
    return
  }

  isSubmitting.value = true
  
  const originalAmount = Number(form.value.amount)
  const currency = form.value.currency
  
  // 如果不是本币，计算换算后的金额存入 amount
  // originalAmount 存原始外币金额
  const payload = {
    ...form.value,
    categoryId: form.value.subCategoryId || form.value.categoryId, // 始终发送叶子节点 ID
    originalAmount: originalAmount,
    currency: currency,
    amount: currency === store.baseCurrency 
      ? originalAmount 
      : store.convertAmount(originalAmount, currency),
    exchangeRate: currency === store.baseCurrency 
      ? 1 
      : (store.convertAmount(originalAmount, currency) / originalAmount).toFixed(4)
  }

  // 移除多余的 subCategoryId 字段，因为后端只需要一个 categoryId
  delete payload.subCategoryId

  let success = false
  if (props.initialData) {
    // 编辑模式：调用更新方法
    success = await store.updateTransaction(props.initialData.id, payload)
  } else {
    // 新增模式：调用添加方法
    success = await store.addTransaction(payload)
  }
  
  isSubmitting.value = false

  if (success) {
    emit('success') // 提交成功后通知父组件
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col max-h-[calc(90vh-120px)]">
    <!-- 可滚动区域 -->
    <div class="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pb-4">
        <!-- Type Switcher -->
        <div class="md:col-span-2 flex p-1.5 bg-slate-100 rounded-2xl mb-2">
          <button 
            type="button"
            @click="form.type = 'expense'; form.categoryId = ''; form.subCategoryId = ''"
            class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
            :class="form.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            支出
          </button>
          <button 
            type="button"
            @click="form.type = 'income'; form.categoryId = ''; form.subCategoryId = ''"
            class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
            :class="form.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            收入
          </button>
          <button 
            type="button"
            @click="form.type = 'transfer'; form.categoryId = ''; form.subCategoryId = ''"
            class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
            :class="form.type === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            转账
          </button>
        </div>

        <!-- Amount & Currency -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-bold text-slate-700">金额</label>
            <div v-if="form.currency !== store.baseCurrency" class="text-[10px] text-slate-400 flex items-center gap-1">
              汇率按当前数据计算
              <button 
                type="button" 
                @click="store.fetchExchangeRates" 
                class="hover:text-primary-500 transition-colors disabled:opacity-50"
                :disabled="store.isFetchingRates"
              >
                <RefreshCw :size="10" :class="{ 'animate-spin': store.isFetchingRates }" />
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <!-- Currency Selector -->
            <div class="w-28 shrink-0">
              <select
                v-model="form.currency"
                class="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-bold appearance-none"
              >
                <option
                  v-for="c in currencies"
                  :key="c.code"
                  :value="c.code"
                >
                  {{ c.code }}
                </option>
              </select>
            </div>
            <!-- Amount Input -->
            <div class="relative flex-1">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">{{ currentCurrencySymbol }}</span>
              <input 
                v-model="form.amount"
                type="number" 
                step="0.01"
                required
                placeholder="0.00"
                class="w-full pl-9 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-xl font-bold"
              />
            </div>
          </div>
          <!-- Conversion Preview -->
          <div v-if="convertedAmount !== null" class="flex items-center gap-2 px-3 py-2 bg-primary-50/50 rounded-lg border border-primary-100/50 animate-in fade-in slide-in-from-top-1 duration-200">
            <span class="text-xs text-primary-600 font-medium flex items-center gap-1">
              <ChevronRight :size="12" />
              约合人民币：<span class="text-sm font-bold">¥ {{ convertedAmount }}</span>
            </span>
            <span class="text-[10px] text-primary-400 ml-auto">
              1 {{ form.currency }} ≈ {{ (convertedAmount / Number(form.amount)).toFixed(4) }} CNY
            </span>
          </div>
        </div>

        <!-- Date Selection -->
        <div class="space-y-2">
          <label class="block text-sm font-bold text-slate-700">日期</label>
          <div class="relative">
            <Calendar :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              v-model="form.date"
              type="date" 
              required
              class="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base appearance-none"
            />
          </div>
        </div>

        <!-- Account -->
        <div v-if="form.type !== 'transfer'" class="space-y-2">
          <label class="block text-sm font-bold text-slate-700">账户</label>
          <div class="relative">
            <select
              v-model="form.accountId"
              class="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none"
            >
              <option
                v-for="acc in store.accounts"
                :key="acc.id"
                :value="acc.id"
              >
                {{ acc.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Transfer Accounts -->
        <div v-else class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-bold text-slate-700">转出</label>
            <div class="relative">
              <select
                v-model="form.fromAccountId"
                class="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none"
              >
                <option
                  v-for="acc in store.accounts"
                  :key="acc.id"
                  :value="acc.id"
                >
                  {{ acc.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-bold text-slate-700">转入</label>
            <div class="relative">
              <select
                v-model="form.toAccountId"
                class="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none"
              >
                <option
                  v-for="acc in store.accounts"
                  :key="acc.id"
                  :value="acc.id"
                >
                  {{ acc.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label class="block text-sm font-bold text-slate-700">备注 <span class="text-slate-400 font-normal">(选填)</span></label>
          <input 
            v-model="form.description"
            type="text" 
            placeholder="想记点什么？"
            class="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
          />
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <label class="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <TagIcon :size="16" class="text-slate-400" />
            标签
          </label>
          
          <div class="relative">
            <input 
              v-model="tagInput"
              @keydown.enter.prevent="addTag"
              @blur="addTag"
              type="text" 
              placeholder="按回车确认"
              class="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-300"
            />
          </div>
        </div>

        <!-- Selected Tags Display (Full width) -->
        <div v-if="form.tags.length > 0" class="md:col-span-2 flex flex-wrap gap-2 mt-[-4px]">
          <span 
            v-for="(tag, index) in form.tags" 
            :key="index"
            class="flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold border border-primary-100"
          >
            #{{ tag }}
            <button @click="removeTag(index)" type="button" class="hover:text-primary-800">
              <X :size="12" />
            </button>
          </span>
        </div>

        <!-- Category (Full width) -->
        <div v-if="form.type !== 'transfer'" class="md:col-span-2 space-y-3 mt-2">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-bold text-slate-700">分类 <span class="text-rose-500">*</span></label>
            <span v-if="formError === '请选择一个分类'" class="text-xs font-bold text-rose-500 animate-pulse">请选择一个分类</span>
          </div>
          
          <!-- Parent Categories -->
          <div 
            class="grid grid-cols-4 sm:grid-cols-8 gap-3 p-1 rounded-2xl transition-all"
            :class="{ 'ring-2 ring-rose-500/20 bg-rose-50/10': formError === '请选择一个分类' }"
          >
            <button 
              v-for="cat in filteredCategories" 
              :key="cat.id"
              type="button"
              @click="selectCategory(cat.id)"
              class="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-all"
              :class="form.categoryId === cat.id 
                ? 'bg-primary-50 border-primary-500 text-primary-600 shadow-sm' 
                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'"
            >
              <component :is="getIcon(cat.icon)" :size="20" />
              <span class="text-xs font-bold">{{ cat.name }}</span>
            </button>
          </div>

          <!-- Sub Categories -->
          <div v-if="selectedCategory?.children?.length" class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div class="flex flex-wrap gap-2.5">
              <button 
                v-for="sub in selectedCategory.children" 
                :key="sub.id"
                type="button"
                @click="selectSubCategory(sub.id)"
                class="px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all flex items-center gap-1.5"
                :class="form.subCategoryId === sub.id 
                  ? 'bg-white border-primary-500 text-primary-600 shadow-sm' 
                  : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200'"
              >
                <component :is="getIcon(sub.icon)" :size="14" />
                {{ sub.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit (Full width) - 固定在底部 -->
    <div class="pt-4 border-t border-slate-100 bg-white mt-auto">
      <div v-if="formError" class="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
        <X :size="16" />
        {{ formError }}
      </div>
      <button 
        type="submit"
        class="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary-200 flex items-center justify-center gap-2 text-base"
      >
        <Check :size="20" />
        保存账单
      </button>
    </div>
  </form>
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

