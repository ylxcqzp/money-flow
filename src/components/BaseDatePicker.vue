<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, startOfWeek, endOfWeek, parseISO, subDays, startOfYear, endOfYear, setMonth, setYear } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ChevronsLeft, ChevronsRight, Clock } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: ''
  },
  placeholder: {
    type: String,
    default: '选择日期'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  min: {
    type: String,
    default: ''
  },
  max: {
    type: String,
    default: ''
  },
  // 是否显示快捷选项
  showShortcuts: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref(null)
const dropdownRef = ref(null)
const viewMode = ref('day') // day, month, year
const currentViewDate = ref(new Date()) // 用于控制面板显示的日期（年月）

// 弹窗位置
const popupPosition = ref({ top: '0px', left: '0px' })

// 初始化
watch(() => props.modelValue, (val) => {
  if (val) {
    const date = typeof val === 'string' ? parseISO(val) : val
    if (!isNaN(date.getTime())) {
      currentViewDate.value = date
    }
  }
}, { immediate: true })

// 格式化显示
const formattedDate = computed(() => {
  if (!props.modelValue) return ''
  const date = typeof props.modelValue === 'string' ? parseISO(props.modelValue) : props.modelValue
  if (isNaN(date.getTime())) return ''
  return format(date, 'yyyy-MM-dd')
})

const headerLabel = computed(() => {
  if (viewMode.value === 'year') {
    const start = Math.floor(currentViewDate.value.getFullYear() / 12) * 12
    return `${start} - ${start + 11}`
  }
  if (viewMode.value === 'month') {
    return format(currentViewDate.value, 'yyyy年')
  }
  return format(currentViewDate.value, 'yyyy年 MM月', { locale: zhCN })
})

// --- 日历视图逻辑 ---
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const calendarDays = computed(() => {
  const monthStart = startOfMonth(currentViewDate.value)
  const monthEnd = endOfMonth(currentViewDate.value)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  return eachDayOfInterval({ start: startDate, end: endDate })
})

// --- 年月视图逻辑 ---
const months = Array.from({ length: 12 }, (_, i) => {
  return { index: i, name: format(new Date(2000, i, 1), 'MMM', { locale: zhCN }) }
})

const years = computed(() => {
  const currentYear = currentViewDate.value.getFullYear()
  const start = Math.floor(currentYear / 12) * 12
  return Array.from({ length: 12 }, (_, i) => start + i)
})

// --- 操作逻辑 ---
const updatePosition = () => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  
  // 使用 fixed 定位，不需要加 scroll 距离
  popupPosition.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`
  }
}

const togglePicker = async () => {
  if (props.disabled) return
  if (!isOpen.value) {
    isOpen.value = true
    viewMode.value = 'day'
    // 如果没有选中值，默认显示当前月份；如果有选中值，显示选中值所在月份
    if (props.modelValue) {
      currentViewDate.value = typeof props.modelValue === 'string' ? parseISO(props.modelValue) : props.modelValue
    } else {
      currentViewDate.value = new Date()
    }
    await nextTick()
    updatePosition()
  } else {
    isOpen.value = false
  }
}

// 点击外部关闭
const handleClickOutside = (e) => {
  if (
    containerRef.value && 
    !containerRef.value.contains(e.target) && 
    dropdownRef.value && 
    !dropdownRef.value.contains(e.target)
  ) {
    isOpen.value = false
  }
}

// 导航控制
const handlePrev = () => {
  if (viewMode.value === 'day') {
    currentViewDate.value = subMonths(currentViewDate.value, 1)
  } else if (viewMode.value === 'month') {
    currentViewDate.value = subYears(currentViewDate.value, 1)
  } else if (viewMode.value === 'year') {
    currentViewDate.value = subYears(currentViewDate.value, 12)
  }
}

const handleNext = () => {
  if (viewMode.value === 'day') {
    currentViewDate.value = addMonths(currentViewDate.value, 1)
  } else if (viewMode.value === 'month') {
    currentViewDate.value = addYears(currentViewDate.value, 1)
  } else if (viewMode.value === 'year') {
    currentViewDate.value = addYears(currentViewDate.value, 12)
  }
}

const handleHeaderClick = () => {
  if (viewMode.value === 'day') {
    viewMode.value = 'month'
  } else if (viewMode.value === 'month') {
    viewMode.value = 'year'
  }
}

// 选择逻辑
const selectDate = (date) => {
  emit('update:modelValue', format(date, 'yyyy-MM-dd'))
  isOpen.value = false
}

const selectMonth = (monthIndex) => {
  currentViewDate.value = setMonth(currentViewDate.value, monthIndex)
  viewMode.value = 'day'
}

const selectYear = (year) => {
  currentViewDate.value = setYear(currentViewDate.value, year)
  viewMode.value = 'month'
}

const clearDate = (e) => {
  e.stopPropagation()
  emit('update:modelValue', '')
}

// 快捷选项
const shortcuts = [
  { label: '今天', value: () => new Date() },
  { label: '昨天', value: () => subDays(new Date(), 1) },
  { label: '本月初', value: () => startOfMonth(new Date()) },
  { label: '上月初', value: () => startOfMonth(subMonths(new Date(), 1)) },
]

const handleShortcut = (getter) => {
  const date = getter()
  currentViewDate.value = date
  selectDate(date)
}

// 辅助判断
const isSelected = (date) => {
  if (!props.modelValue) return false
  const selected = typeof props.modelValue === 'string' ? parseISO(props.modelValue) : props.modelValue
  return isSameDay(date, selected)
}

const isCurrentMonth = (date) => isSameMonth(date, currentViewDate.value)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})
</script>

<template>
  <div class="relative w-full" ref="containerRef">
    <!-- Trigger Input -->
    <div 
      @click="togglePicker"
      class="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 transition-all cursor-pointer group hover:bg-slate-100 hover:border-slate-300"
      :class="{ 
        'opacity-60 cursor-not-allowed': disabled,
        'ring-2 ring-primary-500 border-primary-500 bg-white': isOpen 
      }"
    >
      <CalendarIcon 
        :size="18" 
        class="text-slate-400 group-hover:text-primary-500 transition-colors mr-3 shrink-0" 
      />
      
      <span v-if="formattedDate" class="flex-1 font-bold text-slate-700 truncate tracking-wide">
        {{ formattedDate }}
      </span>
      <span v-else class="flex-1 text-slate-400 truncate">
        {{ placeholder }}
      </span>

      <button 
        type="button"
        v-if="formattedDate && !disabled"
        @click="clearDate"
        class="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors ml-2"
      >
        <X :size="14" />
      </button>
    </div>

    <!-- Calendar Dropdown (Teleported) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0 translate-y-2"
        enter-to-class="transform scale-100 opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100 translate-y-0"
        leave-to-class="transform scale-95 opacity-0 translate-y-2"
      >
        <div 
          v-if="isOpen"
          ref="dropdownRef"
          class="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row"
          :style="{ top: popupPosition.top, left: popupPosition.left }"
        >
          <!-- Shortcuts Sidebar -->
          <div v-if="showShortcuts" class="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-2 flex md:flex-col gap-1 overflow-x-auto md:w-28 shrink-0">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 hidden md:block">
              快速选择
            </div>
            <button
              v-for="item in shortcuts"
              :key="item.label"
              type="button"
              @click="handleShortcut(item.value)"
              class="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-white hover:text-primary-600 hover:shadow-sm rounded-lg transition-all text-left flex items-center gap-2 whitespace-nowrap"
            >
              <Clock :size="12" class="opacity-50" />
              {{ item.label }}
            </button>
          </div>

          <!-- Main Calendar Area -->
          <div class="p-4 w-[320px]">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4 px-1">
              <button type="button" @click="handlePrev" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
                <ChevronLeft :size="20" />
              </button>
              
              <button 
                type="button"
                @click="handleHeaderClick"
                class="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-sm font-bold text-slate-800 transition-all flex items-center gap-1"
              >
                {{ headerLabel }}
              </button>

              <button type="button" @click="handleNext" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
                <ChevronRight :size="20" />
              </button>
            </div>

            <!-- Day View -->
            <div v-if="viewMode === 'day'">
              <!-- Week Days -->
              <div class="grid grid-cols-7 mb-2">
                <div 
                  v-for="day in weekDays" 
                  :key="day"
                  class="h-8 flex items-center justify-center text-xs font-bold text-slate-400"
                >
                  {{ day }}
                </div>
              </div>
              <!-- Days Grid -->
              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="date in calendarDays"
                  :key="date.toISOString()"
                  type="button"
                  @click="selectDate(date)"
                  class="h-9 w-9 rounded-xl text-sm flex items-center justify-center transition-all relative"
                  :class="[
                    !isCurrentMonth(date) ? 'text-slate-300' : 'text-slate-700 hover:bg-slate-100 hover:text-primary-600 hover:font-bold',
                    isSelected(date) ? '!bg-primary-600 !text-white shadow-md shadow-primary-500/30 font-bold hover:!bg-primary-700' : '',
                    isToday(date) && !isSelected(date) ? 'text-primary-600 font-bold bg-primary-50 ring-1 ring-primary-100' : ''
                  ]"
                >
                  {{ format(date, 'd') }}
                  <span 
                    v-if="isToday(date)" 
                    class="absolute bottom-1 w-1 h-1 rounded-full"
                    :class="isSelected(date) ? 'bg-white' : 'bg-primary-500'"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Month View -->
            <div v-else-if="viewMode === 'month'" class="grid grid-cols-3 gap-3">
              <button
                v-for="month in months"
                :key="month.index"
                type="button"
                @click="selectMonth(month.index)"
                class="h-12 rounded-xl text-sm font-medium transition-all hover:bg-slate-100 hover:text-primary-600"
                :class="{
                  'bg-primary-600 text-white shadow-md shadow-primary-500/30 font-bold hover:!bg-primary-700': month.index === currentViewDate.getMonth()
                }"
              >
                {{ month.name }}
              </button>
            </div>

            <!-- Year View -->
            <div v-else class="grid grid-cols-3 gap-3">
              <button
                v-for="year in years"
                :key="year"
                type="button"
                @click="selectYear(year)"
                class="h-12 rounded-xl text-sm font-medium transition-all hover:bg-slate-100 hover:text-primary-600"
                :class="{
                  'bg-primary-600 text-white shadow-md shadow-primary-500/30 font-bold hover:!bg-primary-700': year === currentViewDate.getFullYear()
                }"
              >
                {{ year }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
