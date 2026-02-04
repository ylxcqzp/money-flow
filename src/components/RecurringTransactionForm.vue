<script setup>
/**
 * 周期账单设置表单 RecurringTransactionForm.vue
 * 用于创建周期性执行的交易配置（如房租、订阅服务、工资发放等）
 */
import { ref, computed } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { X, Calendar, Repeat, Tag, DollarSign, Info, Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle } from 'lucide-vue-next'

// --- Props 与 Emits ---

const props = defineProps(['initialData'])
const emit = defineEmits(['close', 'success'])

// --- 状态与 Store ---

const store = useTransactionStore()

// 表单响应式数据
const formData = ref({
  description: '',      // 账单描述
  amount: '',           // 金额
  type: 'expense',      // 类型：支出/收入
  categoryId: 'exp_other', // 默认为"其他支出"
  subCategoryId: '',    // 子分类 ID
  frequency: 'monthly', // 重复频率：每日/每周/每月/每年
  startDate: new Date().toISOString().split('T')[0], // 开始日期
  accountId: store.accounts[0]?.id || '1'           // 关联账户
})

/**
 * 切换交易类型
 * @param {'expense'|'income'} type 
 */
const handleTypeChange = (type) => {
  formData.value.type = type
  // 切换类型时，根据类型自动预选默认分类
  formData.value.categoryId = type === 'expense' ? 'exp_other' : 'inc_other'
  formData.value.subCategoryId = ''
}

// --- 计算属性 ---

/**
 * 平铺化的分类列表，用于 Select 下拉框展示，保持父子层级视觉效果
 */
const flatCategories = computed(() => {
  const result = []
  store.categories
    .filter(c => c.type === formData.value.type)
    .forEach(cat => {
      // 添加父分类
      result.push({ id: cat.id, name: cat.name, isParent: true })
      // 如果有子分类，添加带缩进的子分类
      if (cat.children) {
        cat.children.forEach(sub => {
          result.push({ id: sub.id, name: `  └─ ${sub.name}`, parentId: cat.id })
        })
      }
    })
  return result
})

// --- 业务逻辑 ---

/**
 * 处理分类选择变更，自动关联父分类 ID
 */
const handleCategoryChange = (e) => {
  const selectedId = e.target.value
  const found = flatCategories.value.find(c => c.id === selectedId)
  if (found.parentId) {
    // 选中了子分类
    formData.value.categoryId = found.parentId
    formData.value.subCategoryId = found.id
  } else {
    // 选中了父分类
    formData.value.categoryId = found.id
    formData.value.subCategoryId = ''
  }
}

// 频率选项配置
const frequencies = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' }
]

/**
 * 提交表单逻辑
 */
const handleSubmit = () => {
  store.addRecurringTransaction({
    ...formData.value,
    amount: Number(formData.value.amount),
    startDate: new Date(formData.value.startDate).toISOString()
  })
  emit('success')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <!-- 弹窗遮罩层 -->
    <Transition name="fade" appear>
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" @click="emit('close')"></div>
    </Transition>

    <!-- 弹窗主体 -->
    <Transition name="modal" appear>
      <div class="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden pointer-events-auto">
          <!-- 头部 -->
          <div class="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
            <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Repeat class="text-primary-500" :size="20" />
              设置周期账单
            </h3>
            <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
              <X :size="20" />
            </button>
          </div>

          <!-- 表单主体 -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
            <!-- 类型切换：支出/收入 -->
            <div class="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-xl">
              <button 
                type="button"
                @click="handleTypeChange('expense')"
                :class="[
                  'py-2 rounded-lg text-sm font-medium transition-all',
                  formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                ]"
              >
                支出
              </button>
              <button 
                type="button"
                @click="handleTypeChange('income')"
                :class="[
                  'py-2 rounded-lg text-sm font-medium transition-all',
                  formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                ]"
              >
                收入
              </button>
            </div>

            <div class="space-y-4">
              <!-- 描述输入 -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">描述</label>
                <div class="relative">
                  <Info class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                  <input 
                    v-model="formData.description"
                    type="text" 
                    required
                    placeholder="例如：每月房租、Netflix订阅"
                    class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                  >
                </div>
              </div>

              <!-- 金额与分类 -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">金额</label>
                  <div class="relative">
                    <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input 
                      v-model="formData.amount"
                      type="number" 
                      step="0.01"
                      required
                      placeholder="0.00"
                      class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    >
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">分类</label>
                  <div class="relative">
                    <Tag class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <select 
                      :value="formData.subCategoryId || formData.categoryId"
                      @change="handleCategoryChange"
                      class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none appearance-none text-sm"
                    >
                      <option value="" disabled>选择分类</option>
                      <option v-for="cat in flatCategories" :key="cat.id" :value="cat.id">
                        {{ cat.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 频率与日期 -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">重复频率</label>
                  <div class="relative">
                    <Repeat class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <select 
                      v-model="formData.frequency"
                      class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none appearance-none"
                    >
                      <option v-for="freq in frequencies" :key="freq.value" :value="freq.value">{{ freq.label }}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
                  <div class="relative">
                    <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                    <input 
                      v-model="formData.startDate"
                      type="date" 
                      required
                      class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    >
                  </div>
                </div>
              </div>

              <!-- 结算账户选择 -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">结算账户</label>
                <div class="relative">
                  <Info class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
                  <select 
                    v-model="formData.accountId"
                    class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none appearance-none"
                  >
                    <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 表单操作按钮 -->
            <div class="pt-4 flex gap-3">
              <button 
                type="button"
                @click="emit('close')"
                class="flex-1 px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                type="submit"
                class="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-200"
              >
                确认设置
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
