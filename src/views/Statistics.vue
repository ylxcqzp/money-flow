<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTransactionStore } from '../stores/transaction';
import { 
  ChevronLeft, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3,
  Calendar as CalendarIcon,
  ArrowLeft,
  Download,
  Filter,
  Check,
  X,
  FileText,
  CreditCard,
  Tag as TagIcon,
  Wallet,
  ArrowRight
} from 'lucide-vue-next';
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ECharts imports
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components';

// PDF 导出
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// 注册 ECharts 必须的组件
use([
  CanvasRenderer,
  PieChart,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
]);

const router = useRouter();
const store = useTransactionStore();

// --- 状态管理 ---
const chartType = ref<'expense' | 'income'>('expense');
const drilldownCategoryId = ref<string | null>(null);

// 自定义筛选状态
const filterStartDate = ref(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
const filterEndDate = ref(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
const selectedAccountIds = ref<string[]>([]);
const selectedTags = ref<string[]>([]);
const showFilterPanel = ref(false);

// --- 数据计算逻辑 ---

/**
 * 获取分类名称
 * @param id 分类ID
 * @returns {string} 分类名称
 */
const getCategoryName = (id: string) => {
  const cat = store.findCategoryById(id);
  return cat ? cat.name : '未知';
};

/**
 * 组合筛选后的交易数据
 */
const filteredData = computed(() => {
  return store.transactions.filter(t => {
    const tDate = parseISO(t.date);
    const start = startOfDay(parseISO(filterStartDate.value));
    const end = endOfDay(parseISO(filterEndDate.value));
    
    // 时间筛选
    const dateMatch = isWithinInterval(tDate, { start, end });
    if (!dateMatch) return false;

    // 账户筛选
    if (selectedAccountIds.value.length > 0) {
      if (!selectedAccountIds.value.includes(t.accountId || '1')) return false;
    }

    // 标签筛选
    if (selectedTags.value.length > 0) {
      if (!t.tags || t.tags.length === 0) return false;
      const tagMatch = selectedTags.value.some(tag => t.tags.includes(tag));
      if (!tagMatch) return false;
    }

    return true;
  });
});

/**
 * 筛选后的收支汇总
 */
const summary = computed(() => {
  const income = filteredData.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const expense = filteredData.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return { income, expense, balance: income - expense };
});

/**
 * 饼图配置选项
 * 计算当前筛选下的分类占比数据，支持下钻逻辑
 */
const pieChartOption = computed(() => {
  const transactions = filteredData.value.filter(t => t.type === chartType.value);
  
  let data: { name: string, value: number, id: string }[] = [];
  
  if (!drilldownCategoryId.value) {
    const summaryMap: Record<string, number> = {};
    transactions.forEach(t => {
      const catId = t.categoryId;
      if (catId) {
        summaryMap[catId] = (summaryMap[catId] || 0) + Number(t.amount);
      }
    });
    
    data = Object.entries(summaryMap).map(([id, value]) => ({
      id,
      name: getCategoryName(id),
      value
    }));
  } else {
    const parentId = drilldownCategoryId.value;
    const summaryMap: Record<string, number> = {};
    
    transactions.filter(t => t.categoryId === parentId).forEach(t => {
      const subCatId = t.subCategoryId || 'other';
      summaryMap[subCatId] = (summaryMap[subCatId] || 0) + Number(t.amount);
    });
    
    data = Object.entries(summaryMap).map(([id, value]) => ({
      id,
      name: id === 'other' ? '其他' : getCategoryName(id),
      value
    }));
  }

  data.sort((a, b) => b.value - a.value);

  return {
    title: {
      text: drilldownCategoryId.value 
        ? `${getCategoryName(drilldownCategoryId.value)} - 子类分布` 
        : `${chartType.value === 'expense' ? '支出' : '收入'}分类占比`,
      left: 'center',
      top: 20,
      textStyle: { color: '#334155', fontWeight: '600' }
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle', padding: [0, 0, 0, 20] },
    series: [{
      name: '分类金额',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: data
    }]
  };
});

/**
 * 折线图配置选项 (按日/按月聚合)
 */
const lineChartOption = computed(() => {
  const dateMap: Record<string, { income: number, expense: number }> = {};
  
  filteredData.value.forEach(t => {
    const dateKey = t.date.split('T')[0];
    if (!dateMap[dateKey]) dateMap[dateKey] = { income: 0, expense: 0 };
    if (t.type === 'income') dateMap[dateKey].income += Number(t.amount);
    else if (t.type === 'expense') dateMap[dateKey].expense += Number(t.amount);
  });

  const dates = Object.keys(dateMap).sort();
  const incomeData = dates.map(d => dateMap[d].income);
  const expenseData = dates.map(d => dateMap[d].expense);

  return {
    title: { text: '时段收支趋势', left: 'center', top: 20, textStyle: { color: '#334155', fontWeight: '600' } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], bottom: 10 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '20%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dates, axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' } },
    series: [
      { name: '收入', type: 'line', smooth: true, data: incomeData, itemStyle: { color: '#10b981' } },
      { name: '支出', type: 'line', smooth: true, data: expenseData, itemStyle: { color: '#ef4444' } }
    ]
  };
});

/**
 * 处理饼图点击事件
 */
const onPieClick = (params: any) => {
  if (!drilldownCategoryId.value) {
    const category = store.findCategoryById(params.data.id);
    if (category && category.children && category.children.length > 0) {
      drilldownCategoryId.value = params.data.id;
    }
  }
};

/**
 * 重置下钻
 */
const goBackToTopLevel = () => { drilldownCategoryId.value = null; };

/**
 * 切换账户筛选
 */
const toggleAccount = (id: string) => {
  const index = selectedAccountIds.value.indexOf(id);
  if (index === -1) selectedAccountIds.value.push(id);
  else selectedAccountIds.value.splice(index, 1);
};

/**
 * 切换标签筛选
 */
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index === -1) selectedTags.value.push(tag);
  else selectedTags.value.splice(index, 1);
};

/**
 * 重置所有筛选
 */
const resetFilters = () => {
  filterStartDate.value = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  filterEndDate.value = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  selectedAccountIds.value = [];
  selectedTags.value = [];
};

/**
 * 生成并导出 PDF 报表
 */
const isExporting = ref(false);
const exportToPDF = async () => {
  if (isExporting.value) return;
  
  console.log('开始导出 PDF...');
  isExporting.value = true;
  store.addNotification('正在准备报表数据...', 'info');

  try {
    const element = document.getElementById('report-content');
    if (!element) {
      console.error('未找到 id 为 report-content 的元素');
      throw new Error('找不到报表内容区域');
    }

    console.log('正在捕捉页面内容 (html2canvas)...');
    store.addNotification('正在生成报表图片，请稍候...', 'info');

    // 等待一小会儿确保图表渲染完成并稳定
    await new Promise(resolve => setTimeout(resolve, 800));

    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true, // 开启日志方便调试
      width: element.offsetWidth,
      height: element.offsetHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById('report-content');
        if (clonedElement) {
          clonedElement.style.height = 'auto';
          clonedElement.style.overflow = 'visible';
          clonedElement.style.backgroundColor = '#ffffff';
        }
      }
    });
    
    console.log('内容捕捉完成，正在转换 PDF...');
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const margin = 10; // 边距 10mm
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
    
    // 检查是否需要分页
    let heightLeft = contentHeight;
    let position = margin;

    console.log(`PDF 内容高度: ${contentHeight}mm, A4 可用高度: ${pdfHeight}mm`);

    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    
    // 如果内容超过一页，这里简单处理（后续可优化多页切割）
    // 目前保持在一页内，jspdf 会根据 contentHeight 渲染
    
    const fileName = `财务报表_${filterStartDate.value}_至_${filterEndDate.value}.pdf`;
    console.log(`正在触发浏览器下载: ${fileName}`);
    pdf.save(fileName);
    
    store.addNotification('报表已生成！请查看浏览器的“下载”文件夹', 'success');
  } catch (error: any) {
    console.error('PDF 导出过程出错:', error);
    store.addNotification(`报表生成失败: ${error.message || '未知错误'}`, 'error');
  } finally {
    isExporting.value = false;
    console.log('导出流程结束');
  }
};

</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-12">
    <!-- 顶部导航栏 -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button @click="router.back()" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft :size="24" class="text-slate-600" />
          </button>
          <h1 class="text-xl font-bold text-slate-900">自定义报表</h1>
        </div>
        
        <div class="flex items-center gap-3">
          <button 
            @click="showFilterPanel = !showFilterPanel"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            :class="showFilterPanel ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            <Filter :size="18" />
            高级筛选
          </button>
          <button 
            @click="exportToPDF"
            :disabled="isExporting"
            class="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download v-if="!isExporting" :size="18" />
            <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            导出 PDF
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 筛选面板 -->
      <div v-if="showFilterPanel" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- 时间范围 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CalendarIcon :size="16" /> 时间范围
            </label>
            <div class="flex items-center gap-2">
              <input 
                type="date" 
                v-model="filterStartDate"
                class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <ArrowRight :size="16" class="text-slate-400" />
              <input 
                type="date" 
                v-model="filterEndDate"
                class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <!-- 账户选择 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CreditCard :size="16" /> 关联账户
            </label>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="acc in store.accounts" 
                :key="acc.id"
                @click="toggleAccount(acc.id)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                :class="selectedAccountIds.includes(acc.id) 
                  ? 'bg-primary-50 border-primary-200 text-primary-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'"
              >
                {{ acc.name }}
              </button>
            </div>
          </div>

          <!-- 标签选择 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <TagIcon :size="16" /> 标签筛选
            </label>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="tag in store.allTags" 
                :key="tag"
                @click="toggleTag(tag)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                :class="selectedTags.includes(tag) 
                  ? 'bg-primary-50 border-primary-200 text-primary-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'"
              >
                #{{ tag }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-6 pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button @click="resetFilters" class="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
            重置筛选
          </button>
          <button @click="showFilterPanel = false" class="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-sm">
            确认应用
          </button>
        </div>
      </div>

      <!-- 报表导出内容区域 -->
      <div id="report-content" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <!-- 报表头部 -->
        <div class="p-8 bg-slate-900 text-white">
          <div class="flex justify-between items-start mb-6">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white">
                  <Wallet :size="24" />
                </div>
                <h2 class="text-2xl font-bold tracking-tight">个人财务报表</h2>
              </div>
              <p class="text-slate-400 text-sm">生成时间：{{ format(new Date(), 'yyyy-MM-dd HH:mm') }}</p>
            </div>
            <div class="text-right">
              <div class="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">统计周期</div>
              <div class="text-lg font-medium">{{ filterStartDate }} 至 {{ filterEndDate }}</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-8 pt-6 border-t border-white/10">
            <div>
              <div class="text-emerald-400 text-xs font-semibold mb-1 uppercase">总收入</div>
              <div class="text-3xl font-bold">¥ {{ summary.income.toLocaleString() }}</div>
            </div>
            <div>
              <div class="text-rose-400 text-xs font-semibold mb-1 uppercase">总支出</div>
              <div class="text-3xl font-bold">¥ {{ summary.expense.toLocaleString() }}</div>
            </div>
            <div>
              <div class="text-primary-400 text-xs font-semibold mb-1 uppercase">净收支</div>
              <div class="text-3xl font-bold">¥ {{ summary.balance.toLocaleString() }}</div>
            </div>
          </div>
        </div>

        <div class="p-8 space-y-12">
          <!-- 图表展示 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-[400px] flex flex-col relative">
              <div class="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                <button 
                  @click="chartType = 'expense'; goBackToTopLevel()"
                  class="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  :class="chartType === 'expense' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                >
                  支出
                </button>
                <button 
                  @click="chartType = 'income'; goBackToTopLevel()"
                  class="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  :class="chartType === 'income' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                >
                  收入
                </button>
              </div>
              <v-chart class="flex-1" :option="pieChartOption" autoresize @click="onPieClick" />
            </div>
            
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-[400px]">
              <v-chart class="h-full" :option="lineChartOption" autoresize />
            </div>
          </div>

          <!-- 交易明细表格 -->
          <div>
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText :size="20" class="text-primary-600" />
                收支明细
              </h3>
              <span class="text-sm text-slate-500">共 {{ filteredData.length }} 笔记录</span>
            </div>
            
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th class="pb-3 px-4">日期</th>
                    <th class="pb-3 px-4">分类</th>
                    <th class="pb-3 px-4">说明</th>
                    <th class="pb-3 px-4">账户</th>
                    <th class="pb-3 px-4 text-right">金额</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="t in filteredData.slice(0, 50)" :key="t.id" class="text-sm hover:bg-slate-50 transition-colors">
                    <td class="py-4 px-4 text-slate-500">{{ format(parseISO(t.date), 'MM-dd') }}</td>
                    <td class="py-4 px-4 font-medium text-slate-700">
                      {{ getCategoryName(t.categoryId) }}
                      <span v-if="t.subCategoryId" class="text-xs text-slate-400 font-normal"> / {{ getCategoryName(t.subCategoryId) }}</span>
                    </td>
                    <td class="py-4 px-4 text-slate-600">{{ t.description || '-' }}</td>
                    <td class="py-4 px-4">
                      <span class="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {{ store.accounts.find(a => a.id === (t.accountId || '1'))?.name }}
                      </span>
                    </td>
                    <td class="py-4 px-4 text-right font-bold" :class="t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'">
                      {{ t.type === 'income' ? '+' : '-' }} {{ Number(t.amount).toLocaleString() }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="filteredData.length > 50" class="mt-4 text-center text-sm text-slate-400 italic">
                注：明细表仅展示前 50 笔交易，完整数据请见汇总。
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.v-chart { width: 100%; }

/* 打印/导出优化：确保颜色在 Canvas 截取时生效 */
#report-content {
  -webkit-print-color-adjust: exact;
}
</style>
