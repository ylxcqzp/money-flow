<script setup>
/**
 * 账户管理组件 AccountManager.vue
 * 负责显示所有账户、其当前余额，并提供添加、编辑和删除账户的功能
 */
import { ref, nextTick } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { ElMessageBox } from 'element-plus'
import { 
  Plus, Trash2, Edit2, Wallet, CreditCard, Smartphone, MessageCircle, 
  Save, X, Check, Info
} from 'lucide-vue-next'
import BaseSelect from './BaseSelect.vue'

// --- 状态与初始化 ---

const store = useTransactionStore()
const emit = defineEmits(['close']) // 事件：关闭弹窗
const editingId = ref(null)         // 当前正在编辑的账户 ID，null 表示新增模式
const formRef = ref(null)           // 表单 DOM 引用，用于滚动定位
const isSubmitting = ref(false)     // 提交状态

// 表单响应式数据
const newAccount = ref({
  name: '',
  type: 'cash',
  icon: 'Wallet',
  initialBalance: 0
})

// 可选图标配置
const icons = [
  { name: 'Wallet', component: Wallet, label: '钱包' },
  { name: 'CreditCard', component: CreditCard, label: '银行卡' },
  { name: 'Smartphone', component: Smartphone, label: '手机支付' },
  { name: 'MessageCircle', component: MessageCircle, label: '微信/聊天' }
]

const accountTypeOptions = [
  { value: 'cash', label: '现金账户' },
  { value: 'card', label: '银行卡/电子钱包' }
]

// --- 逻辑方法 ---

/**
 * 根据图标名称获取对应的组件
 * @param {string} name 图标名称
 */
const getIcon = (name) => {
  const icon = icons.find(i => i.name === name)
  return icon ? icon.component : Wallet
}

/**
 * 开始编辑账户
 * @param {Object} account 被选中的账户对象
 */
const startEdit = (account) => {
  editingId.value = account.id
  newAccount.value = { ...account }
  
  // 自动滚动到编辑表单区域
  nextTick(() => {
    formRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  })
}

/**
 * 取消当前编辑，重置表单
 */
const cancelEdit = () => {
  editingId.value = null
  resetForm()
}

/**
 * 重置表单到初始状态
 */
const resetForm = () => {
  newAccount.value = {
    name: '',
    type: 'cash',
    icon: 'Wallet',
    initialBalance: 0
  }
  editingId.value = null
}

/**
 * 处理添加账户逻辑
 */
const handleAdd = async () => {
  if (!newAccount.value.name) return
  
  isSubmitting.value = true
  const success = await store.addAccount({ ...newAccount.value })
  isSubmitting.value = false
  
  if (success) {
    resetForm()
    emit('close')
  }
}

/**
 * 处理更新账户逻辑
 */
const handleUpdate = async () => {
  if (!newAccount.value.name) return
  
  isSubmitting.value = true
  const success = await store.updateAccount(editingId.value, { ...newAccount.value })
  isSubmitting.value = false
  
  if (success) {
    resetForm()
    emit('close')
  }
}

/**
 * 处理删除账户逻辑
 * @param {string} id 账户 ID
 */
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个账户吗？如果该账户已有交易记录，将无法删除。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await store.deleteAccount(id)
  } catch (e) {
    // cancelled
  }
}
</script>

<template>
  <div class="space-y-6 pb-4">
    <!-- 提示信息：解释初始余额的作用 -->
    <div class="flex items-start gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-100 text-primary-700">
      <Info :size="18" class="shrink-0 mt-0.5" />
      <div class="text-xs leading-relaxed">
        <p class="font-bold mb-1">关于初始余额</p>
        <p>设置账户的初始余额后，系统会自动根据该账户的收支记录计算实时余额。例如：银行卡初始 ¥5000，支出 ¥200，实时余额即为 ¥4800。</p>
      </div>
    </div>

    <!-- 账户列表展示区域 -->
    <div class="space-y-3">
      <div 
        v-for="acc in store.accounts" 
        :key="acc.id"
        class="group flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md hover:shadow-slate-100/50"
        :class="editingId === acc.id ? 'border-primary-300 bg-primary-50/30' : 'border-slate-100 bg-white'"
      >
        <!-- 账户详情信息 -->
        <div class="flex items-center gap-4 flex-1">
          <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
            <component :is="getIcon(acc.icon)" :size="24" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-slate-700 truncate">{{ acc.name }}</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                {{ acc.type === 'cash' ? '现金' : '电子/银行' }}
              </span>
              <span class="text-[10px] text-slate-400">初始余额: ¥{{ acc.initialBalance || 0 }}</span>
            </div>
          </div>
          <!-- 实时余额显示 -->
          <div class="text-right mr-4">
            <p class="text-sm font-bold text-slate-900">¥{{ store.accountBalances[acc.id]?.toFixed(2) }}</p>
            <p class="text-[10px] text-slate-400">当前余额</p>
          </div>
        </div>
        
        <!-- 操作按钮：编辑与删除 -->
        <div class="flex items-center gap-1 shrink-0 border-l border-slate-50 pl-2">
          <button @click="startEdit(acc)" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
            <Edit2 :size="18" />
          </button>
          <button @click="handleDelete(acc.id)" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
            <Trash2 :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- 表单区域：用于添加或修改账户 -->
    <div ref="formRef" class="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 relative overflow-hidden group">
      <!-- 背景修饰图标 -->
      <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <component :is="editingId ? Edit2 : Plus" :size="48" class="text-primary-600" />
      </div>
      
      <!-- 表单标题 -->
      <h3 class="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 relative z-10">
        <div class="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
          <component :is="editingId ? Edit2 : Plus" :size="14" />
        </div>
        {{ editingId ? '编辑账户' : '添加新账户' }}
      </h3>
      
      <div class="space-y-5 relative z-10">
        <!-- 账户名称与初始余额 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">账户名称</label>
            <input 
              v-model="newAccount.name"
              type="text" 
              placeholder="例如：招商银行"
              class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium placeholder:text-slate-300"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">初始余额</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
              <input 
                v-model="newAccount.initialBalance"
                type="number" 
                step="0.01"
                placeholder="0.00"
                class="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <!-- 账户类型与图标选择 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">账户类型</label>
            <BaseSelect 
              v-model="newAccount.type"
              :options="accountTypeOptions"
              placeholder="选择账户类型"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">选择图标</label>
            <div class="flex gap-2">
              <button 
                v-for="icon in icons" 
                :key="icon.name"
                @click="newAccount.icon = icon.name"
                type="button"
                class="w-10 h-10 flex items-center justify-center rounded-xl border transition-all"
                :class="newAccount.icon === icon.name 
                  ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 ring-2 ring-primary-500/10' 
                  : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'"
                :title="icon.label"
              >
                <component :is="icon.component" :size="20" />
              </button>
            </div>
          </div>
        </div>

        <!-- 操作按钮组 -->
        <div class="flex gap-3 pt-2">
          <button 
            v-if="editingId"
            @click="cancelEdit"
            class="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            取消
          </button>
          <button 
            @click="editingId ? handleUpdate() : handleAdd()"
            :disabled="isSubmitting"
            class="flex-[2] py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <component :is="isSubmitting ? 'div' : (editingId ? Save : Plus)" :size="18" :class="{ 'animate-spin': isSubmitting && !editingId && !Save }" />
            <span v-if="isSubmitting">处理中...</span>
            <span v-else>{{ editingId ? '保存修改' : '确认添加' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
