<script setup>
/**
 * 预算设置组件 BudgetSetter.vue
 * 提供一个界面，允许用户为当前选中的月份设置总支出预算以及各分类的月度限额
 */
import { ref, computed, nextTick, watch } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { 
  Check, Loader2, AlertCircle, HelpCircle, Plus, Edit2, Trash2, X, Search,
  Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, 
  ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp,
  Apple, Baby, Beer, Book, Briefcase, Camera, Candy, Cigarette, 
  Cloud, Computer, Dog, Dumbbell, Flower2, Gift, Glasses, GraduationCap, 
  Heart, Home, Image, Key, Laptop, LifeBuoy, Lightbulb, Luggage, 
  Mic, Moon, Music, Palette, Phone, Plane, Salad, Scissors, 
  Smartphone, Sofa, Speaker, Sun, Tablet, Tv, Umbrella, Watch,
  Wrench, Zap, ArrowLeft
} from 'lucide-vue-next'

// --- 定义事件与 Store ---

const emit = defineEmits(['success']) // 事件：保存成功后触发
const store = useTransactionStore()

// 图标组件映射表
const iconComponents = {
  Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, 
  ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle,
  Apple, Baby, Beer, Book, Briefcase, Camera, Candy, Cigarette, 
  Cloud, Computer, Dog, Dumbbell, Flower2, Gift, Glasses, GraduationCap, 
  Heart, Home, Image, Key, Laptop, LifeBuoy, Lightbulb, Luggage, 
  Mic, Moon, Music, Palette, Phone, Plane, Salad, Scissors, 
  Smartphone, Sofa, Speaker, Sun, Tablet, Tv, Umbrella, Watch,
  Wrench, Zap
}

const getIcon = (name) => iconComponents[name] || HelpCircle

// --- 响应式数据 ---

// 获取当前月份的原始预算数据
// 使用 watch 监听 store 数据变化，确保异步加载的数据能正确反映到表单中
const totalBudget = ref('')
const categoryBudgets = ref({})

watch(() => store.currentBudget, (newVal) => {
  const rawBudgetData = newVal || {}
  const isOldFormat = typeof rawBudgetData === 'number'
  
  // 如果当前已经在编辑中（有值），可能不希望被覆盖？
  // 但这是设置页面，通常期望显示最新数据。
  // 为了简单起见，每次 store 更新都同步，除非用户正在输入（这比较复杂，这里假设打开时数据已就绪或加载后更新）
  
  totalBudget.value = isOldFormat ? rawBudgetData : (rawBudgetData.total || '')
  categoryBudgets.value = isOldFormat ? {} : { ...(rawBudgetData.categories || {}) }
}, { immediate: true, deep: true })

// 模态框状态
const showPicker = ref(false) // 是否显示分类选择器
const showAmountInput = ref(false) // 是否显示金额输入框
const currentTargetCategory = ref(null) // 当前正在操作的分类对象
const tempAmount = ref('') // 临时输入的金额
const amountInputRef = ref(null) // 金额输入框引用

// --- 计算属性 ---

/**
 * 过滤出支出类型的顶级分类
 */
const expenseCategories = computed(() => {
  return store.categories.filter(c => c.type === 'expense')
})

/**
 * 计算当前所有分类预算的总和
 */
const totalCategoryBudget = computed(() => {
  return Object.values(categoryBudgets.value).reduce((sum, val) => {
    return sum + (Number(val) || 0)
  }, 0)
})

/**
 * 获取已设置预算的分类列表
 */
const setCategoryBudgetsList = computed(() => {
  return expenseCategories.value
    .filter(cat => {
      const amount = categoryBudgets.value[cat.id]
      return amount !== undefined && amount !== null && amount !== '' && Number(amount) > 0
    })
    .map(cat => ({
      ...cat,
      amount: categoryBudgets.value[cat.id]
    }))
})

const isSubmitting = ref(false)

// --- 业务逻辑 ---

/**
 * 开始添加分类预算
 */
const startAdd = () => {
  showPicker.value = true
}

/**
 * 选择分类
 */
const selectCategory = (cat) => {
  currentTargetCategory.value = cat
  // 如果已存在预算，预填
  tempAmount.value = categoryBudgets.value[cat.id] || ''
  showPicker.value = false
  showAmountInput.value = true
  
  // 自动聚焦输入框
  nextTick(() => {
    if (amountInputRef.value) amountInputRef.value.focus()
  })
}

/**
 * 开始编辑已有分类预算
 */
const startEdit = (cat) => {
  currentTargetCategory.value = cat
  tempAmount.value = categoryBudgets.value[cat.id]
  showAmountInput.value = true
  
  // 自动聚焦输入框
  nextTick(() => {
    if (amountInputRef.value) amountInputRef.value.focus()
  })
}

/**
 * 确认金额输入
 */
const confirmAmount = () => {
  const amount = Number(tempAmount.value)
  if (amount < 0) {
    store.addNotification('预算金额不能为负数', 'error')
    return
  }
  
  if (currentTargetCategory.value) {
    if (tempAmount.value && amount > 0) {
      categoryBudgets.value[currentTargetCategory.value.id] = amount
    } else {
      // 如果清空或为0，视为移除
      delete categoryBudgets.value[currentTargetCategory.value.id]
    }
  }
  
  closeModals()
}

/**
 * 关闭所有模态框
 */
const closeModals = () => {
  showPicker.value = false
  showAmountInput.value = false
  currentTargetCategory.value = null
  tempAmount.value = ''
}

/**
 * 移除某个分类的预算
 */
const removeCategoryBudget = (catId) => {
  delete categoryBudgets.value[catId]
}

/**
 * 处理保存预算的操作
 */
const handleSave = async () => {
  let total = Number(totalBudget.value) || 0
  const sum = totalCategoryBudget.value

  // 逻辑修改：
  // 1. 如果没有填写总预算，或者总预算小于分类预算之和 -> 总预算 = 分类预算之和
  if (total === 0 || sum > total) {
    total = sum
    totalBudget.value = sum // 更新 UI
  }
  
  if (total < 0) {
    store.addNotification('总预算不能为负数', 'error')
    return
  }

  const budgetData = {
    total: total,
    categories: {}
  }

  // 整理分类预算
  Object.entries(categoryBudgets.value).forEach(([id, amount]) => {
    if (amount !== '' && amount !== null && Number(amount) > 0) {
      budgetData.categories[id] = Number(amount)
    }
  })

  // 将输入值存入 Store
  isSubmitting.value = true
  const success = await store.setBudget(store.currentMonthKey, budgetData)
  isSubmitting.value = false
  
  if (success) {
    emit('success')
  }
}
</script>

<template>
  <div class="h-[65vh] flex flex-col relative overflow-hidden bg-white">
    
    <!-- 主界面 -->
    <div class="flex flex-col h-full">
      <!-- 头部信息与总预算 -->
      <div class="flex-none space-y-4 pb-4">
        <!-- 提示信息 -->
        <div class="p-3 bg-primary-50 rounded-xl text-primary-700 text-sm flex items-center justify-between">
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
              min="0"
              step="100"
              placeholder="自动计算（可选）"
              class="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-xl font-bold placeholder:text-slate-300"
            />
          </div>
          <p class="text-[10px] text-slate-400 px-1">
            * 若未填写或小于分类预算总和，保存时将自动更新为分类预算之和
          </p>
        </div>
      </div>

      <!-- 分类预算列表区域 -->
      <div class="flex-1 flex flex-col min-h-0 border-t border-slate-50 pt-4">
        <div class="flex items-center justify-between px-1 mb-3 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">分类预算</span>
            <span v-if="totalCategoryBudget > 0" class="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-bold">
              合计 ¥{{ totalCategoryBudget }}
            </span>
          </div>
          <button 
            @click="startAdd"
            class="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1.5 rounded-lg transition-all"
          >
            <Plus :size="14" />
            <span>添加</span>
          </button>
        </div>

        <!-- 已设置的分类列表 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div v-if="setCategoryBudgetsList.length > 0" class="space-y-2">
            <div 
              v-for="cat in setCategoryBudgetsList" 
              :key="cat.id"
              class="group flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/10 transition-all"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-50">
                  <component :is="getIcon(cat.icon)" :size="18" />
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-700">{{ cat.name }}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-slate-900">¥{{ cat.amount }}</span>
                
                <!-- 悬浮操作按钮 -->
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="startEdit(cat)"
                    class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all shadow-sm"
                    title="编辑"
                  >
                    <Edit2 :size="14" />
                  </button>
                  <button 
                    @click="removeCategoryBudget(cat.id)"
                    class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all shadow-sm"
                    title="删除"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="h-full flex flex-col items-center justify-center text-slate-300 gap-2 min-h-[120px]">
            <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
              <HelpCircle :size="20" class="opacity-50" />
            </div>
            <p class="text-xs font-medium">暂未添加分类预算</p>
            <button 
              @click="startAdd"
              class="mt-2 text-xs font-bold text-primary-600 border border-primary-200 px-4 py-2 rounded-xl hover:bg-primary-50 transition-all"
            >
              点击添加
            </button>
          </div>
        </div>
      </div>

      <!-- 底部保存按钮 -->
      <div class="flex-none pt-4 mt-2 border-t border-slate-50">
        <button 
          @click="handleSave"
          :disabled="isSubmitting"
          class="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary-200 flex items-center justify-center gap-2 group"
        >
          <Loader2 v-if="isSubmitting" class="animate-spin" :size="20" />
          <Check v-else :size="20" class="group-hover:scale-110 transition-transform" />
          <span v-if="isSubmitting">正在保存...</span>
          <span v-else>保存设置</span>
        </button>
      </div>
    </div>

    <!-- 弹窗 1: 分类选择器 -->
    <Transition name="fade">
      <div v-if="showPicker" class="absolute inset-0 z-10 bg-white flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-slate-50">
          <h3 class="font-bold text-slate-800">选择分类</h3>
          <button @click="closeModals" class="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
            <X :size="20" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div class="grid grid-cols-3 gap-3">
            <button 
              v-for="cat in expenseCategories" 
              :key="cat.id"
              @click="selectCategory(cat)"
              class="flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group"
              :class="{ 'opacity-50 grayscale': categoryBudgets[cat.id] }"
            >
              <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-primary-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                <component :is="getIcon(cat.icon)" :size="20" />
              </div>
              <span class="text-xs font-bold text-slate-600 group-hover:text-slate-800 truncate w-full text-center">{{ cat.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 弹窗 2: 金额输入 -->
    <Transition name="fade">
      <div v-if="showAmountInput" class="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
        <!-- 点击背景关闭 -->
        <div class="absolute inset-0" @click="closeModals"></div>
        
        <div class="relative w-full sm:w-[90%] bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up sm:animate-zoom-in">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
              <component :is="getIcon(currentTargetCategory?.icon)" :size="24" />
            </div>
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">设置预算</p>
              <h3 class="text-xl font-bold text-slate-800">{{ currentTargetCategory?.name }}</h3>
            </div>
            <button @click="closeModals" class="ml-auto p-2 text-slate-400 hover:bg-slate-50 rounded-full">
              <X :size="20" />
            </button>
          </div>

          <div class="space-y-6">
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">¥</span>
              <input 
                ref="amountInputRef"
                v-model="tempAmount"
                type="number"
                min="0"
                step="100"
                placeholder="0.00"
                class="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary-500 rounded-2xl text-3xl font-bold text-slate-800 outline-none transition-all placeholder:text-slate-200"
                @keyup.enter="confirmAmount"
              />
            </div>

            <button 
              @click="confirmAmount"
              class="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary-200 active:scale-[0.98] transition-all"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>

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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-zoom-in {
  animation: zoom-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes zoom-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>