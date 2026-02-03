<script setup>
import { ref, computed } from 'vue'
import { useTransactionStore } from '../stores/transaction'
import { Check, X, ChevronRight, Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp, HelpCircle, Tag as TagIcon, Hash } from 'lucide-vue-next'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['success'])
const store = useTransactionStore()

const form = ref(props.initialData ? { 
  ...props.initialData,
  accountId: props.initialData.accountId || '1',
  fromAccountId: props.initialData.fromAccountId || '1',
  toAccountId: props.initialData.toAccountId || '2',
  categoryId: props.initialData.categoryId || '',
  subCategoryId: props.initialData.subCategoryId || '',
  tags: props.initialData.tags || []
} : {
  description: '',
  amount: '',
  type: 'expense',
  categoryId: '',
  subCategoryId: '',
  accountId: store.accounts[0]?.id || '1',
  fromAccountId: store.accounts[0]?.id || '1',
  toAccountId: store.accounts[1]?.id || '2',
  tags: []
})

const tagInput = ref('')

const addTag = () => {
  const tag = tagInput.value.trim().replace(/^#/, '')
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  tagInput.value = ''
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}

const selectQuickTag = (tag) => {
  if (!form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
}

const filteredCategories = computed(() => {
  return store.categories.filter(c => c.type === form.value.type)
})

const selectedCategory = computed(() => {
  return store.findCategoryById(form.value.categoryId)
})

const getIcon = (name) => {
  const icons = {
    Utensils, Bike, ChefHat, Coffee, Car, Bus, CarTaxiFront, Fuel, ShoppingBag, Store, Shirt, Gamepad2, Banknote, Trophy, TrendingUp
  }
  return icons[name] || HelpCircle
}

const selectCategory = (catId) => {
  form.value.categoryId = catId
  form.value.subCategoryId = '' // Reset sub-category when parent changes
}

const selectSubCategory = (subCatId) => {
  form.value.subCategoryId = subCatId
}

const handleSubmit = () => {
  if (!form.value.description || !form.value.amount) return
  
  const payload = {
    ...form.value,
    amount: Number(form.value.amount)
  }

  if (props.initialData) {
    store.updateTransaction(props.initialData.id, payload)
  } else {
    store.addTransaction(payload)
  }
  
  emit('success')
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Type Switcher -->
    <div class="flex p-1 bg-slate-100 rounded-xl">
      <button 
        type="button"
        @click="form.type = 'expense'; form.categoryId = ''; form.subCategoryId = ''"
        class="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
        :class="form.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
      >
        支出
      </button>
      <button 
        type="button"
        @click="form.type = 'income'; form.categoryId = ''; form.subCategoryId = ''"
        class="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
        :class="form.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
      >
        收入
      </button>
      <button 
        type="button"
        @click="form.type = 'transfer'; form.categoryId = ''; form.subCategoryId = ''"
        class="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
        :class="form.type === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
      >
        转账
      </button>
    </div>

    <!-- Amount -->
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1">金额</label>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
        <input 
          v-model="form.amount"
          type="number" 
          step="0.01"
          required
          placeholder="0.00"
          class="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-xl font-semibold"
        />
      </div>
    </div>

    <!-- Account -->
    <div v-if="form.type !== 'transfer'">
      <label class="block text-sm font-medium text-slate-700 mb-1">账户</label>
      <select 
        v-model="form.accountId"
        required
        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
      >
        <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">
          {{ acc.name }}
        </option>
      </select>
    </div>

    <!-- Transfer Accounts -->
    <div v-else class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">转出账户</label>
        <select 
          v-model="form.fromAccountId"
          required
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
        >
          <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">
            {{ acc.name }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">转入账户</label>
        <select 
          v-model="form.toAccountId"
          required
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
        >
          <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">
            {{ acc.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1">备注</label>
      <input 
        v-model="form.description"
        type="text" 
        required
        placeholder="想记点什么？"
        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
      />
    </div>

    <!-- Tags -->
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
        <TagIcon :size="16" class="text-slate-400" />
        标签
        <span class="text-[10px] text-slate-400 font-normal">(可选)</span>
      </label>
      
      <!-- Selected Tags -->
      <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
        <span 
          v-for="(tag, index) in form.tags" 
          :key="index"
          class="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold border border-primary-100 group transition-all"
        >
          <Hash :size="10" />
          {{ tag }}
          <button @click="removeTag(index)" type="button" class="p-0.5 hover:bg-primary-100 rounded-md transition-colors">
            <X :size="12" />
          </button>
        </span>
      </div>

      <!-- Tag Input -->
      <div class="relative mb-3">
        <input 
          v-model="tagInput"
          @keydown.enter.prevent="addTag"
          @blur="addTag"
          type="text" 
          placeholder="添加标签（如：聚餐、旅行），按回车确认"
          class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm placeholder:text-slate-300"
        />
      </div>

      <!-- Quick Select Existing Tags -->
      <div v-if="store.allTags.length > 0" class="space-y-2">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">常用标签</p>
        <div class="flex flex-wrap gap-1.5">
          <button 
            v-for="tag in store.allTags" 
            :key="tag"
            type="button"
            @click="selectQuickTag(tag)"
            class="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50 transition-all"
            :class="{ 'opacity-50 pointer-events-none grayscale': form.tags.includes(tag) }"
          >
            #{{ tag }}
          </button>
        </div>
      </div>
    </div>

    <!-- Category -->
    <div v-if="form.type !== 'transfer'">
      <label class="block text-sm font-medium text-slate-700 mb-2">分类</label>
      
      <!-- Parent Categories -->
      <div class="grid grid-cols-4 gap-2 mb-3">
        <button 
          v-for="cat in filteredCategories" 
          :key="cat.id"
          type="button"
          @click="selectCategory(cat.id)"
          class="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all"
          :class="form.categoryId === cat.id 
            ? 'bg-primary-50 border-primary-200 text-primary-600' 
            : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'"
        >
          <component :is="getIcon(cat.icon)" :size="20" />
          <span class="text-[10px] font-medium">{{ cat.name }}</span>
        </button>
      </div>

      <!-- Sub Categories -->
      <div v-if="selectedCategory?.children?.length" class="bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 px-1">二级分类</div>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="sub in selectedCategory.children" 
            :key="sub.id"
            type="button"
            @click="selectSubCategory(sub.id)"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5"
            :class="form.subCategoryId === sub.id 
              ? 'bg-white border-primary-200 text-primary-600 shadow-sm' 
              : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200'"
          >
            <component :is="getIcon(sub.icon)" :size="14" />
            {{ sub.name }}
          </button>
        </div>
      </div>
    </div>

    <button 
      type="submit"
      class="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary-100 flex items-center justify-center gap-2"
    >
      <Check :size="20" />
      保存账单
    </button>
  </form>
</template>
