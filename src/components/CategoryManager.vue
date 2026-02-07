<script setup>
/**
 * 分类管理组件 CategoryManager.vue
 * 负责展示和管理账单分类（收入/支出），支持父子两级结构，提供添加、编辑和删除功能
 */
import { ref, computed } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { ElMessageBox } from 'element-plus'
import { 
  Plus, Trash2, Edit2, ChevronRight, ChevronDown, 
  Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, 
  ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, 
  HelpCircle, Save, X, ChevronUp, ChevronLeft,
  Apple, Baby, Beer, Book, Briefcase, Camera, Candy, Cigarette, 
  Cloud, Computer, Dog, Dumbbell, Flower2, Gift, Glasses, GraduationCap, 
  Heart, Home, Image, Key, Laptop, LifeBuoy, Lightbulb, Luggage, 
  Mic, Moon, Music, Palette, Phone, Plane, Salad, Scissors, 
  Smartphone, Sofa, Speaker, Sun, Tablet, Tv, Umbrella, Watch,
  Wrench, Zap, ArrowLeft
} from 'lucide-vue-next'

// --- 状态初始化 ---

const store = useTransactionStore()
const activeTab = ref('expense')         // 当前激活的标签页：'expense' 支出 或 'income' 收入
const editingId = ref(null)              // 正在编辑的分类 ID
const addingToParentId = ref(null)       // 正在为哪个父分类添加子分类
const isSubmitting = ref(false)          // 提交状态
// 默认全部折叠
const collapsedCategories = ref(new Set(store.categories.map(c => c.id)))
const viewMode = ref('list')             // 'list' | 'form'

// 图标分页状态
const iconPageIndex = ref(0)
const iconsPerPage = 12

// --- 逻辑方法 ---

/**
 * 切换分类的展开/折叠状态
 * @param {string} id 分类 ID
 */
const toggleCollapse = (id) => {
  if (collapsedCategories.value.has(id)) {
    collapsedCategories.value.delete(id)
  } else {
    collapsedCategories.value.add(id)
  }
}

/**
 * 判断分类是否处于折叠状态
 * @param {string} id 分类 ID
 */
const isCollapsed = (id) => collapsedCategories.value.has(id)

// 表单响应式数据
const newCategory = ref({
  name: '',
  icon: 'HelpCircle',
  type: 'expense'
})

/**
 * 根据当前标签页过滤显示的分类列表
 */
const categoriesToDisplay = computed(() => {
  if (activeTab.value === 'all') return store.categories
  return store.categories.filter(c => c.type === activeTab.value)
})

// 扩展后的可选图标列表
const icons = [
  'Utensils', 'Bike', 'ChefHat', 'Coffee', 'Car', 'Bus', 'CarTaxiFront', 'Fuel', 
  'ShoppingBag', 'Store', 'Shirt', 'Gamepad2', 'Banknote', 'Trophy', 'TrendingUp', 'HelpCircle',
  'Apple', 'Baby', 'Beer', 'Book', 'Briefcase', 'Camera', 'Candy', 'Cigarette', 
  'Cloud', 'Computer', 'Dog', 'Dumbbell', 'Flower2', 'Gift', 'Glasses', 'GraduationCap', 
  'Heart', 'Home', 'Image', 'Key', 'Laptop', 'LifeBuoy', 'Lightbulb', 'Luggage', 
  'Mic', 'Moon', 'Music', 'Palette', 'Phone', 'Plane', 'Salad', 'Scissors', 
  'Smartphone', 'Sofa', 'Speaker', 'Sun', 'Tablet', 'Tv', 'Umbrella', 'Watch',
  'Wrench', 'Zap'
]

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

/**
 * 图标分页逻辑
 */
const paginatedIcons = computed(() => {
  const start = iconPageIndex.value * iconsPerPage
  return icons.slice(start, start + iconsPerPage)
})

const totalIconPages = computed(() => Math.ceil(icons.length / iconsPerPage))

// 轮播方向
const slideDirection = ref('right') // 'left' | 'right'

const nextIconPage = () => {
  if (iconPageIndex.value < totalIconPages.value - 1) {
    slideDirection.value = 'right'
    iconPageIndex.value++
  }
}

const prevIconPage = () => {
  if (iconPageIndex.value > 0) {
    slideDirection.value = 'left'
    iconPageIndex.value--
  }
}

/**
 * 获取图标组件
 * @param {string} name 图标名称
 */
const getIcon = (name) => iconComponents[name] || HelpCircle

/**
 * 进入添加主分类模式
 */
const startAddMain = () => {
  addingToParentId.value = null
  editingId.value = null
  newCategory.value = {
    name: '',
    icon: 'HelpCircle',
    type: activeTab.value
  }
  viewMode.value = 'form'
}

/**
 * 进入编辑模式
 * @param {Object} cat 分类对象
 */
const startEdit = (cat) => {
  addingToParentId.value = null // 清除添加子分类状态
  editingId.value = cat.id
  newCategory.value = { ...cat }
  viewMode.value = 'form'
}

/**
 * 触发为某个父分类添加子分类
 * @param {string} parentId 父分类 ID
 */
const startAddSub = (parentId) => {
  editingId.value = null // 清除编辑状态
  addingToParentId.value = parentId
  newCategory.value = {
    name: '',
    icon: 'HelpCircle',
    type: activeTab.value
  }
  viewMode.value = 'form'
}

/**
 * 取消编辑或添加操作，返回列表
 */
const cancelEdit = () => {
  resetForm()
}

/**
 * 重置表单状态
 */
const resetForm = () => {
  newCategory.value = {
    name: '',
    icon: 'HelpCircle',
    type: activeTab.value
  }
  editingId.value = null
  addingToParentId.value = null
  viewMode.value = 'list'
}

/**
 * 处理添加分类逻辑
 */
const handleAdd = async () => {
  if (!newCategory.value.name) return
  
  isSubmitting.value = true
  const success = await store.addCategory({ ...newCategory.value }, addingToParentId.value)
  isSubmitting.value = false
  
  if (success) {
    resetForm()
  }
}

/**
 * 处理更新分类逻辑
 */
const handleUpdate = async () => {
  if (!newCategory.value.name) return
  
  isSubmitting.value = true
  const success = await store.updateCategory(editingId.value, { ...newCategory.value })
  isSubmitting.value = false
  
  if (success) {
    resetForm()
  }
}

/**
 * 处理删除分类逻辑
 * @param {string} id 分类 ID
 */
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个分类吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await store.deleteCategory(id)
  } catch (e) {
    // cancelled
  }
}
</script>

<template>
  <div class="h-full flex flex-col relative overflow-hidden min-h-0">
    <!-- 视图切换动画 -->
    <Transition name="fade-slide" mode="out-in">
      
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="flex flex-col h-full min-h-0" key="list">
        <!-- 顶部固定区域：切换标签与添加按钮 -->
        <div class="flex-none px-8 pt-6 space-y-4">
          <!-- 顶部类型切换标签 -->
          <div class="flex p-1.5 bg-slate-100/80 rounded-2xl">
            <button 
              v-for="tab in ['expense', 'income']" 
              :key="tab"
              @click="activeTab = tab; resetForm()"
              class="flex-1 py-2 text-sm font-bold rounded-xl transition-all"
              :class="activeTab === tab ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >
              {{ tab === 'expense' ? '支出分类' : '收入分类' }}
            </button>
          </div>

          <!-- 添加主分类按钮 -->
          <button 
            @click="startAddMain"
            class="w-full py-3 border-2 border-dashed border-primary-200 rounded-2xl flex items-center justify-center gap-2 text-primary-600 font-bold hover:bg-primary-50 hover:border-primary-300 transition-all group"
          >
            <div class="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus :size="14" />
            </div>
            <span>添加新分类</span>
          </button>
        </div>

        <!-- 分类列表展示 (可滚动) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar px-8 py-4 space-y-3">
          <div v-for="cat in categoriesToDisplay" :key="cat.id" class="group/parent">
            <!-- 父分类卡片 -->
            <div 
              class="flex items-center justify-between p-3 rounded-2xl border transition-all hover:shadow-md hover:shadow-slate-100/50"
              :class="editingId === cat.id ? 'border-primary-300 bg-primary-50/30' : 'border-slate-100 bg-white'"
            >
              <div class="flex items-center gap-3 flex-1 cursor-pointer" @click="toggleCollapse(cat.id)">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0 group-hover/parent:bg-primary-50 group-hover/parent:text-primary-600 transition-colors">
                  <component :is="getIcon(cat.icon)" :size="20" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-700 truncate">{{ cat.name }}</p>
                  <p class="text-[10px] text-slate-400 font-medium">{{ cat.children?.length || 0 }} 个子分类</p>
                </div>
                <!-- 展开/收起箭头 -->
                <component 
                  :is="ChevronUp" 
                  :size="16" 
                  class="text-slate-300 group-hover/parent:text-slate-400 mr-2 transition-transform duration-300"
                  :class="{ 'rotate-180': isCollapsed(cat.id) }"
                />
              </div>
              
              <!-- 父分类操作按钮 -->
              <div class="flex items-center gap-1 shrink-0 border-l border-slate-50 pl-2">
                <button @click="startAddSub(cat.id)" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="添加子分类">
                  <Plus :size="16" />
                </button>
                <button @click="startEdit(cat)" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                  <Edit2 :size="16" />
                </button>
                <button @click="handleDelete(cat.id)" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>

            <!-- 子分类列表 (受折叠状态控制) -->
            <div 
              class="grid transition-all duration-300 ease-in-out overflow-hidden"
              :class="isCollapsed(cat.id) ? 'grid-rows-[0fr] opacity-0 mt-0' : 'grid-rows-[1fr] opacity-100 mt-2'"
            >
              <div class="min-h-0 ml-6 pl-6 border-l-2 border-slate-50 space-y-2">
                <div 
                  v-for="sub in cat.children" 
                  :key="sub.id"
                  class="flex items-center justify-between p-2.5 rounded-xl border border-slate-50 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                >
                  <div class="flex items-center gap-2.5 flex-1 min-w-0">
                    <div class="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                      <component :is="getIcon(sub.icon)" :size="12" />
                    </div>
                    <span class="text-sm font-medium text-slate-600 truncate">{{ sub.name }}</span>
                  </div>
                  <!-- 子分类操作按钮 -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button @click="startEdit(sub)" class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all">
                      <Edit2 :size="14" />
                    </button>
                    <button @click="handleDelete(sub.id)" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all">
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 表单视图 -->
      <div v-else class="flex flex-col h-full" key="form">
        <!-- 表单头部 -->
        <div class="flex-none flex items-center gap-3 px-8 pt-6 pb-4 border-b border-slate-50">
          <button @click="cancelEdit" class="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft :size="20" />
          </button>
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <component :is="editingId ? Edit2 : Plus" :size="16" />
            </div>
            {{ editingId ? '编辑分类' : (addingToParentId ? '添加子分类' : '添加主分类') }}
          </h3>
        </div>

        <!-- 表单内容 (可滚动) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
          <div class="space-y-6">
            <!-- 分类名称输入 -->
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">分类名称</label>
              <input 
                v-model="newCategory.name"
                type="text" 
                placeholder="例如：外卖"
                class="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium placeholder:text-slate-300"
                autoFocus
              />
            </div>

            <!-- 分类图标选择轮播 -->
            <div>
              <div class="flex items-center justify-between mb-3 px-1">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">选择图标</label>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{{ iconPageIndex + 1 }} / {{ totalIconPages }}</span>
                  <div class="flex gap-1">
                    <button 
                      @click="prevIconPage" 
                      type="button"
                      class="p-1 rounded-md hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      :disabled="iconPageIndex === 0"
                    >
                      <ChevronLeft :size="14" />
                    </button>
                    <button 
                      @click="nextIconPage" 
                      type="button"
                      class="p-1 rounded-md hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      :disabled="iconPageIndex === totalIconPages - 1"
                    >
                      <ChevronRight :size="14" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="relative overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-100 p-2">
                <Transition :name="slideDirection === 'right' ? 'slide-right' : 'slide-left'" mode="out-in">
                  <div :key="iconPageIndex" class="grid grid-cols-6 gap-2">
                    <button 
                      v-for="icon in paginatedIcons" 
                      :key="icon"
                      @click="newCategory.icon = icon"
                      type="button"
                      class="aspect-square flex items-center justify-center rounded-xl border transition-all"
                      :class="newCategory.icon === icon 
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 ring-2 ring-primary-500/10' 
                        : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'"
                    >
                      <component :is="getIcon(icon)" :size="20" />
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="flex-none px-8 pb-6 pt-4 border-t border-slate-50 flex gap-3">
          <button 
            @click="cancelEdit"
            class="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            取消
          </button>
          <button 
            @click="editingId ? handleUpdate() : handleAdd()"
            :disabled="isSubmitting"
            class="flex-[2] py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <component :is="isSubmitting ? 'div' : (editingId ? Save : Plus)" :size="18" :class="{ 'animate-spin': isSubmitting && !editingId && !Save }" />
            <span v-if="isSubmitting">处理中...</span>
            <span v-else>{{ editingId ? '保存修改' : '确认添加' }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
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

/* 视图切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 轮播图切换动画 */
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease-out;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>