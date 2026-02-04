<script setup>
/**
 * 储蓄目标管理组件 GoalsManager.vue
 * 负责展示和管理储蓄目标，支持目标的创建、删除、进度更新及可视化进度展示
 */
import { ref, computed } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { 
  Plus, Trash2, Target, Trophy, Plane, Home, Car, Laptop, 
  Heart, Gift, ShoppingCart, Briefcase, HelpCircle, Save, X, 
  ChevronRight, ArrowUpCircle, ArrowDownCircle, Calendar
} from 'lucide-vue-next'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const store = useTransactionStore()
const showAddForm = ref(false)
const depositGoalId = ref(null) // 正在存款的目标 ID
const depositAmount = ref('')   // 存款/取款金额

// 新目标表单数据
const newGoal = ref({
  name: '',
  targetAmount: '',
  icon: 'Target',
  color: 'bg-primary-500',
  deadline: ''
})

// 可选图标列表
const icons = [
  { name: 'Target', component: Target },
  { name: 'Plane', component: Plane },
  { name: 'Home', component: Home },
  { name: 'Car', component: Car },
  { name: 'Laptop', component: Laptop },
  { name: 'Heart', component: Heart },
  { name: 'Gift', component: Gift },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Trophy', component: Trophy },
  { name: 'HelpCircle', component: HelpCircle }
]

// 可选颜色列表
const colors = [
  { name: '蓝色', class: 'bg-primary-500' },
  { name: '绿色', class: 'bg-emerald-500' },
  { name: '紫色', class: 'bg-purple-500' },
  { name: '粉色', class: 'bg-pink-500' },
  { name: '橙色', class: 'bg-orange-500' },
  { name: '黄色', class: 'bg-amber-500' },
  { name: '红色', class: 'bg-rose-500' }
]

/**
 * 获取图标组件
 */
const getIcon = (name) => {
  const icon = icons.find(i => i.name === name)
  return icon ? icon.component : Target
}

/**
 * 计算目标进度百分比
 */
const getProgress = (current, target) => {
  if (!target) return '0.00'
  const progress = (current / target) * 100
  return Math.min(100, progress).toFixed(2)
}

/**
 * 格式化剩余时间
 */
const getRemainingTime = (deadline) => {
  if (!deadline) return '长期目标'
  try {
    return formatDistanceToNow(parseISO(deadline), { addSuffix: true, locale: zhCN })
  } catch (e) {
    return '日期无效'
  }
}

/**
 * 处理添加目标
 */
const handleAddGoal = () => {
  if (!newGoal.value.name || !newGoal.value.targetAmount) return
  store.addGoal({
    ...newGoal.value,
    targetAmount: Number(newGoal.value.targetAmount)
  })
  resetForm()
  showAddForm.value = false
}

/**
 * 处理更新进度 (存款/取款)
 */
const handleUpdateProgress = (isDeposit = true) => {
  if (!depositGoalId.value || !depositAmount.value) return
  const amountValue = Number(depositAmount.value)
  
  if (!isDeposit) {
    const goal = store.goals.find(g => g.id === depositGoalId.value)
    if (goal && amountValue > goal.currentAmount) {
      store.addNotification('取出金额不能大于已筹集金额', 'error')
      return
    }
  }

  const amount = isDeposit ? amountValue : -amountValue
  store.updateGoalProgress(depositGoalId.value, amount)
  depositGoalId.value = null
  depositAmount.value = ''
}

/**
 * 重置表单
 */
const resetForm = () => {
  newGoal.value = {
    name: '',
    targetAmount: '',
    icon: 'Target',
    color: 'bg-primary-500',
    deadline: ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 顶部操作栏 -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
          <Target :size="14" />
        </div>
        我的储蓄目标
      </h3>
      <button 
        @click="showAddForm = !showAddForm"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-bold hover:bg-primary-100 transition-all"
      >
        <Plus :size="14" />
        {{ showAddForm ? '取消添加' : '新目标' }}
      </button>
    </div>

    <!-- 添加目标表单 -->
    <div v-if="showAddForm" class="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">目标名称</label>
          <input 
            v-model="newGoal.name"
            type="text" 
            placeholder="例如：旅行基金"
            class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">目标金额 (¥)</label>
          <input 
            v-model="newGoal.targetAmount"
            type="number" 
            placeholder="10000"
            class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">截止日期 (可选)</label>
          <input 
            v-model="newGoal.deadline"
            type="date" 
            class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">选择颜色</label>
          <div class="flex flex-wrap gap-2 pt-1">
            <button 
              v-for="color in colors" 
              :key="color.class"
              @click="newGoal.color = color.class"
              type="button"
              class="w-6 h-6 rounded-full transition-all ring-offset-2"
              :class="[color.class, newGoal.color === color.class ? 'ring-2 ring-slate-400' : 'hover:scale-110']"
            ></button>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">选择图标</label>
        <div class="grid grid-cols-6 md:grid-cols-11 gap-2">
          <button 
            v-for="icon in icons" 
            :key="icon.name"
            @click="newGoal.icon = icon.name"
            type="button"
            class="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
            :class="newGoal.icon === icon.name ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'"
          >
            <component :is="icon.component" :size="18" />
          </button>
        </div>
      </div>

      <button 
        @click="handleAddGoal"
        class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary-100 flex items-center justify-center gap-2"
      >
        <Save :size="18" />
        开启储蓄计划
      </button>
    </div>

    <!-- 目标列表 -->
    <div v-if="store.goals.length > 0" class="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          v-for="goal in store.goals" 
          :key="goal.id"
          class="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
        >
          <!-- 背景装饰 -->
          <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-110 transition-transform" :class="goal.color"></div>

          <div class="flex items-start justify-between mb-4 relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100" :class="goal.color">
                <component :is="getIcon(goal.icon)" :size="24" />
              </div>
              <div>
                <h4 class="font-bold text-slate-800">{{ goal.name }}</h4>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar :size="10" />
                    {{ getRemainingTime(goal.deadline) }}
                  </span>
                </div>
              </div>
            </div>
            <button @click="store.deleteGoal(goal.id)" class="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
              <Trash2 :size="16" />
            </button>
          </div>

          <div class="space-y-4 relative z-10">
            <!-- 进度信息 -->
            <div class="flex items-end justify-between">
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">已筹集</p>
                <div class="flex items-baseline gap-1">
                  <span class="text-sm font-bold text-slate-400">¥</span>
                  <span class="text-xl font-black text-slate-800 tracking-tight">{{ goal.currentAmount.toLocaleString() }}</span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">目标金额</p>
                <p class="text-sm font-bold text-slate-600">¥{{ goal.targetAmount.toLocaleString() }}</p>
              </div>
            </div>

            <!-- 进度条 -->
            <div v-if="goal.currentAmount > 0" class="space-y-1.5 animate-in fade-in duration-500">
              <div class="flex items-center justify-between text-[10px] font-black italic">
                <span class="text-slate-400">PROGRESS</span>
                <span :class="Number(getProgress(goal.currentAmount, goal.targetAmount)) >= 100 ? 'text-emerald-500' : 'text-primary-500'">
                  {{ getProgress(goal.currentAmount, goal.targetAmount) }}%
                </span>
              </div>
              <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-1000 ease-out"
                  :class="[goal.color, Number(getProgress(goal.currentAmount, goal.targetAmount)) >= 100 ? 'animate-pulse' : '']"
                  :style="{ width: `${getProgress(goal.currentAmount, goal.targetAmount)}%` }"
                ></div>
              </div>
            </div>
            <div v-else class="py-3 px-4 bg-slate-50/80 rounded-2xl border border-slate-100/50 flex items-center gap-3 group/empty">
              <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm group-hover/empty:scale-110 transition-transform">
                <Save :size="14" />
              </div>
              <div class="flex-1">
                <div class="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-1.5">
                  <div class="h-full w-8 bg-slate-300 rounded-full animate-shimmer"></div>
                </div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">等待第一笔储蓄...</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2 pt-2">
              <button 
                @click="depositGoalId = goal.id"
                class="flex-1 py-2 bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowUpCircle :size="14" />
                存入资金
              </button>
            </div>
          </div>

          <!-- 存入金额弹出层 -->
          <Transition name="modal">
            <div v-if="depositGoalId === goal.id" class="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6">
              <button @click="depositGoalId = null" class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X :size="16" />
              </button>
              
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">存入/取出金额 (¥)</p>
              <input 
                v-model="depositAmount"
                type="number"
                autoFocus
                placeholder="0.00"
                class="w-full bg-transparent border-b-2 border-primary-500 outline-none text-3xl font-black text-center text-slate-800 pb-2 mb-6 placeholder:text-slate-200"
              />
              
              <div class="flex gap-3 w-full">
                <button 
                  @click="handleUpdateProgress(false)"
                  class="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowDownCircle :size="18" />
                  取出
                </button>
                <button 
                  @click="handleUpdateProgress(true)"
                  class="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
                >
                  <ArrowUpCircle :size="18" />
                  存入
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
      <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-4">
        <Target :size="32" />
      </div>
      <h4 class="text-slate-600 font-bold mb-1">还没有储蓄目标</h4>
      <p class="text-slate-400 text-xs mb-6">设定一个目标，让攒钱更有动力</p>
      <button 
        @click="showAddForm = true"
        class="px-6 py-2.5 bg-white text-primary-600 border border-primary-100 rounded-2xl text-sm font-bold hover:bg-primary-50 transition-all shadow-sm"
      >
        立即创建第一个目标
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
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

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
}
</style>
