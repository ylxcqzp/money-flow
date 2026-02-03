<script setup>
/**
 * 统计数值卡片组件 StatsCard.vue
 * 用于展示关键财务指标（如总余额、月度收入、月度支出等）
 */
defineProps({
  title: String,    // 卡片标题
  amount: Number,   // 展示的金额或数值
  type: String,     // 卡片类型：'balance' 余额, 'income' 收入, 'expense' 支出, 'rate' 比例/百分比，用于配色
  icon: Object,     // Lucide 图标组件
  isPercent: Boolean, // 是否显示为百分比格式
  progress: Number,  // 进度条百分比 (0-100)，可选
  subText: String,   // 辅助文本，显示在数值下方
  tooltipPosition: {
    type: String,
    default: 'top'    // 'top' | 'right'
  }
})
</script>

<template>
  <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
        :class="{
          'bg-primary-50 text-primary-600': type === 'balance',
          'bg-emerald-50 text-emerald-600': type === 'income',
          'bg-rose-50 text-rose-600': type === 'expense',
          'bg-amber-50 text-amber-600': type === 'rate'
        }"
      >
        <component :is="icon" :size="24" />
      </div>
      <div v-if="subText" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
        {{ subText }}
      </div>
    </div>

    <div class="space-y-1">
      <h3 class="text-sm font-bold text-slate-500">{{ title }}</h3>
      <div class="flex items-baseline gap-1">
        <span v-if="!isPercent" class="text-slate-400 font-bold text-sm">¥</span>
        <span class="text-2xl font-black text-slate-800 tracking-tight">
          {{ isPercent ? amount.toFixed(1) : amount.toLocaleString() }}
        </span>
        <span v-if="isPercent" class="text-slate-500 font-bold text-sm">%</span>
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="progress !== undefined" class="mt-4 space-y-1.5">
      <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          class="h-full transition-all duration-1000 ease-out"
          :class="{
            'bg-primary-500': type === 'balance',
            'bg-emerald-500': type === 'income',
            'bg-rose-500': type === 'expense' && progress > 100,
            'bg-amber-500': type === 'rate' || (type === 'expense' && progress <= 100)
          }"
          :style="{ width: `${Math.min(progress, 100)}%` }"
        ></div>
      </div>
    </div>

    <!-- 悬浮提示插槽 -->
    <div v-if="$slots.tooltip" class="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-20">
      <div 
        class="absolute w-64 pointer-events-auto"
        :class="{
          'bottom-full left-1/2 -translate-x-1/2 mb-1': tooltipPosition === 'top',
          'left-full top-1/2 -translate-y-1/2 ml-4': tooltipPosition === 'right'
        }"
      >
        <div 
          class="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl p-4 animate-in fade-in duration-300"
          :class="{
            'slide-in-from-bottom-1': tooltipPosition === 'top',
            'slide-in-from-left-1': tooltipPosition === 'right'
          }"
        >
          <slot name="tooltip"></slot>
          <!-- 小三角 -->
          <div 
            class="absolute border-8 border-transparent"
            :class="{
              'top-full left-1/2 -translate-x-1/2 border-t-slate-900/80': tooltipPosition === 'top',
              'right-full top-1/2 -translate-y-1/2 border-r-slate-900/80': tooltipPosition === 'right'
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
