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
  <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
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

    <!-- Amount -->
    <div class="space-y-2">
      <label class="block text-sm font-bold text-slate-700">金额</label>
      <div class="relative">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">¥</span>
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

    <!-- Account -->
    <div v-if="form.type !== 'transfer'" class="space-y-2">
      <label class="block text-sm font-bold text-slate-700">账户</label>
      <select 
        v-model="form.accountId"
        required
        class="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
      >
        <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">
          {{ acc.name }}
        </option>
      </select>
    </div>

    <!-- Transfer Accounts -->
    <div v-else class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <label class="block text-sm font-bold text-slate-700">转出</label>
        <select 
          v-model="form.fromAccountId"
          required
          class="w-full px-3 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
        >
          <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">
            {{ acc.name }}
          </option>
        </select>
      </div>
      <div class="space-y-2">
        <label class="block text-sm font-bold text-slate-700">转入</label>
        <select 
          v-model="form.toAccountId"
          required
          class="w-full px-3 h-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
        >
          <option v-for="acc in store.accounts" :key="acc.id" :value="acc.id">
            {{ acc.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Description -->
    <div class="space-y-2">
      <label class="block text-sm font-bold text-slate-700">备注</label>
      <input 
        v-model="form.description"
        type="text" 
        required
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
      <label class="block text-sm font-bold text-slate-700">分类</label>
      
      <!-- Parent Categories -->
      <div class="grid grid-cols-4 sm:grid-cols-8 gap-3">
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

    <!-- Submit (Full width) -->
    <div class="md:col-span-2 pt-4">
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
