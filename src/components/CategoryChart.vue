<script setup>
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { computed } from 'vue'
import { useTransactionStore } from '../stores/transaction'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useTransactionStore()

const chartData = computed(() => {
  const categorySums = {}
  store.filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const parentCat = store.findCategoryById(t.categoryId)
      const catName = parentCat?.name || t.category || '未分类'
      categorySums[catName] = (categorySums[catName] || 0) + Number(t.amount)
    })

  return {
    labels: Object.keys(categorySums),
    datasets: [
      {
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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
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
  cutout: '70%'
}
</script>

<template>
  <div class="h-64 relative">
    <Doughnut v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
      <p class="text-sm">暂无支出数据</p>
    </div>
  </div>
</template>
