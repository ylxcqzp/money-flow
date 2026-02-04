<script setup>
/**
 * 分类支出环形图组件 CategoryChart.vue
 * 使用 Chart.js 展示各分类支出的比例，直观呈现消费结构
 */
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { computed } from 'vue'
import { useTransactionStore } from '../stores/transaction'

// 注册 Chart.js 必要的插件
ChartJS.register(ArcElement, Tooltip, Legend)

const store = useTransactionStore()

// --- 数据处理 ---

/**
 * 格式化后的图表数据
 * 过滤出所有支出记录，按父分类名称汇总金额
 */
const chartData = computed(() => {
  const categorySums = {}
  let totalSpending = 0
  
  store.filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      // 查找父分类名称
      const parentCat = store.findCategoryById(t.categoryId)
      const catName = parentCat?.name || t.category || '未分类'
      // 累加金额
      const amount = Number(t.amount)
      categorySums[catName] = (categorySums[catName] || 0) + amount
      totalSpending += amount
    })

  const labels = Object.keys(categorySums).map(name => {
    const amount = categorySums[name]
    const percentage = totalSpending > 0 ? ((amount / totalSpending) * 100).toFixed(1) : 0
    return `${name} ${percentage}%`
  })

  return {
    labels,
    datasets: [
      {
        // 预定义的一组柔和色彩
        backgroundColor: [
          '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', 
          '#f43f5e', '#f97316', '#eab308', '#22c55e'
        ],
        data: Object.values(categorySums),
        borderWidth: 0,
        hoverOffset: 10
      }
    ]
  }
})

/**
 * 图表配置项
 */
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom', // 图例放在底部
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: "'Inter', sans-serif"
        }
      }
    }
  },
  cutout: '70%' // 环形宽度
}
</script>

<template>
  <div class="h-64 relative">
    <!-- 如果有数据则显示环形图，否则显示占位状态 -->
    <Doughnut v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
      <p class="text-sm">暂无支出数据</p>
    </div>
  </div>
</template>
