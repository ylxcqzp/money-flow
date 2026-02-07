<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const containerRef = ref(null)
const dropdownRef = ref(null)
const popupPosition = ref({ top: '0px', left: '0px' })
const dropdownWidth = ref('auto')

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const updatePosition = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  
  popupPosition.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`
  }
  dropdownWidth.value = `${rect.width}px`
}

const toggleDropdown = async () => {
  if (props.disabled) return
  if (!isOpen.value) {
    isOpen.value = true
    await nextTick()
    updatePosition()
  } else {
    isOpen.value = false
  }
}

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

const closeDropdown = (e) => {
  if (
    containerRef.value && 
    !containerRef.value.contains(e.target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(e.target)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', closeDropdown)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', closeDropdown)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})
</script>

<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      class="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between px-4 transition-all outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent group"
      :class="{ 
        'opacity-60 cursor-not-allowed': disabled,
        'ring-2 ring-primary-500 border-transparent': isOpen 
      }"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <component 
          v-if="icon" 
          :is="icon" 
          :size="18" 
          class="text-slate-400 group-hover:text-primary-500 transition-colors shrink-0" 
        />
        <span v-if="selectedOption" class="truncate font-medium text-slate-700">
          {{ selectedOption.label || selectedOption.name }}
        </span>
        <span v-else class="text-slate-400 truncate">
          {{ placeholder }}
        </span>
      </div>
      
      <ChevronDown 
        :size="18" 
        class="text-slate-400 transition-transform duration-300 shrink-0"
        :class="{ 'rotate-180 text-primary-500': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0 -translate-y-2"
        enter-to-class="transform scale-100 opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100 translate-y-0"
        leave-to-class="transform scale-95 opacity-0 -translate-y-2"
      >
        <div 
          v-if="isOpen"
          ref="dropdownRef"
          class="fixed z-[9999] bg-white rounded-xl shadow-xl border border-slate-100 py-1 max-h-60 overflow-y-auto custom-scrollbar"
          :style="{ top: popupPosition.top, left: popupPosition.left, width: dropdownWidth }"
        >
          <div v-if="options.length === 0" class="px-4 py-3 text-sm text-slate-400 text-center">
            无选项
          </div>
          <button
            v-for="option in options"
            :key="option.value || option.id"
            type="button"
            @click="selectOption(option)"
            class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between group"
            :class="{ 'bg-primary-50 text-primary-600 font-medium': modelValue === (option.value || option.id) }"
          >
            <span class="truncate">{{ option.label || option.name }}</span>
            <Check 
              v-if="modelValue === (option.value || option.id)" 
              :size="16" 
              class="text-primary-600"
            />
          </button>
        </div>
      </Transition>
    </Teleport>
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
