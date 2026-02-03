<script setup>
import { ref, computed } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { 
  Plus, Trash2, Edit2, ChevronRight, ChevronDown, 
  Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, 
  ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, 
  HelpCircle, Save, X, ChevronUp
} from 'lucide-vue-next'

const store = useTransactionStore()
const activeTab = ref('expense')
const editingId = ref(null)
const addingToParentId = ref(null)
const collapsedCategories = ref(new Set())

const toggleCollapse = (id) => {
  if (collapsedCategories.value.has(id)) {
    collapsedCategories.value.delete(id)
  } else {
    collapsedCategories.value.add(id)
  }
}

const isCollapsed = (id) => collapsedCategories.value.has(id)

const newCategory = ref({
  name: '',
  icon: 'HelpCircle',
  type: 'expense'
})

const categoriesToDisplay = computed(() => {
  if (activeTab.value === 'all') return store.categories
  return store.categories.filter(c => c.type === activeTab.value)
})

const icons = [
  'Utensils', 'Bike', 'ChefHat', 'Coffee', 'Car', 'Bus', 'CarTaxiFront', 'Fuel', 
  'ShoppingBag', 'Store', 'Shirt', 'Gamepad2', 'Banknote', 'Trophy', 'TrendingUp', 'HelpCircle'
]

const iconComponents = {
  Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, 
  ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle
}

const getIcon = (name) => iconComponents[name] || HelpCircle

const startEdit = (cat) => {
  addingToParentId.value = null // 清除添加子分类状态
  editingId.value = cat.id
  newCategory.value = { ...cat }
}

const cancelEdit = () => {
  editingId.value = null
  addingToParentId.value = null
  resetForm()
}

const resetForm = () => {
  newCategory.value = {
    name: '',
    icon: 'HelpCircle',
    type: activeTab.value
  }
  editingId.value = null
  addingToParentId.value = null
}

const handleAdd = () => {
  if (!newCategory.value.name) return
  store.addCategory({ ...newCategory.value }, addingToParentId.value)
  resetForm()
}

const handleUpdate = () => {
  if (!newCategory.value.name) return
  store.updateCategory(editingId.value, { ...newCategory.value })
  resetForm()
}

const handleDelete = (id) => {
  if (confirm('确定要删除这个分类吗？')) {
    store.deleteCategory(id)
  }
}

const startAddSub = (parentId) => {
  editingId.value = null // 清除编辑状态
  addingToParentId.value = parentId
  newCategory.value = {
    name: '',
    icon: 'HelpCircle',
    type: activeTab.value
  }
}
</script>

<template>
  <div class="space-y-6 pb-4">
    <!-- Tabs -->
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

    <!-- Category List -->
    <div class="space-y-3">
      <div v-for="cat in categoriesToDisplay" :key="cat.id" class="group/parent">
        <!-- Parent Category -->
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
            <component 
              :is="ChevronUp" 
              :size="16" 
              class="text-slate-300 group-hover/parent:text-slate-400 mr-2 transition-transform duration-300"
              :class="{ 'rotate-180': isCollapsed(cat.id) }"
            />
          </div>
          
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

        <!-- Children Categories -->
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

    <!-- Form (Add/Edit) -->
    <div class="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 relative overflow-hidden group">
      <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <component :is="editingId ? Edit2 : Plus" :size="48" class="text-primary-600" />
      </div>
      
      <h3 class="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 relative z-10">
        <div class="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
          <component :is="editingId ? Edit2 : Plus" :size="14" />
        </div>
        {{ editingId ? '编辑分类' : (addingToParentId ? '添加子分类' : '添加主分类') }}
      </h3>
      
      <div class="space-y-5 relative z-10">
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">分类名称</label>
          <input 
            v-model="newCategory.name"
            type="text" 
            placeholder="例如：外卖"
            class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium placeholder:text-slate-300"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">选择图标</label>
          <div class="grid grid-cols-8 gap-2">
            <button 
              v-for="icon in icons" 
              :key="icon"
              @click="newCategory.icon = icon"
              type="button"
              class="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
              :class="newCategory.icon === icon 
                ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 ring-2 ring-primary-500/10' 
                : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'"
            >
              <component :is="getIcon(icon)" :size="18" />
            </button>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button 
            v-if="editingId || addingToParentId"
            @click="cancelEdit"
            class="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            取消
          </button>
          <button 
            @click="editingId ? handleUpdate() : handleAdd()"
            class="flex-[2] py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <component :is="editingId ? Save : Plus" :size="18" />
            {{ editingId ? '保存修改' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>
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
</style>