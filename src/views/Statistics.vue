<script setup lang="ts">
/**
 * 统计报表页面 Statistics.vue
 * 提供收支趋势、分类占比分析以及 PDF 报表导出功能
 */
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
import { BaseDatePicker } from '../components/BaseDatePicker.vue';
import { zhCN } from 'date-fns/locale';

// ECharts 核心模块导入
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

// PDF 导出依赖
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import * as XLSX from 'xlsx';

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

onMounted(async () => {
  if (store.transactions.length === 0 && !store.loading) {
    await store.initData()
  }
})

// --- 状态管理 ---
const chartType = ref<'expense' | 'income'>('expense'); // 图表统计类型：支出/收入
const drilldownCategoryId = ref<string | null>(null);   // 当前下钻的父分类ID

// 自定义高级筛选状态
const filterStartDate = ref(format(startOfMonth(new Date()), 'yyyy-MM-dd')); // 筛选开始日期
const filterEndDate = ref(format(endOfMonth(new Date()), 'yyyy-MM-dd'));   // 筛选结束日期
const selectedAccountIds = ref<string[]>([]);                             // 已选账户ID列表
const selectedTags = ref<string[]>([]);                                   // 已选标签列表
const showFilterPanel = ref(false);                                       // 是否显示高级筛选面板

// --- 数据计算逻辑 ---

/**
 * 根据ID获取完整分类名称（父 - 子）
 * @param id 分类ID
 * @returns {string} 分类名称
 */
const getFullCategoryName = (id: string | number) => {
  const { category, parent } = store.findCategoryWithParent(id);
  if (category) {
    return parent ? `${parent.name} - ${category.name}` : category.name;
  }
  return '未知';
};

/**
 * 根据ID获取分类名称
 * @param id 分类ID
 * @returns {string} 分类名称
 */
const getCategoryName = (id: string) => {
  const cat = store.findCategoryById(id);
  return cat ? cat.name : '未知';
};

/**
 * 组合筛选后的交易数据列表
 * 应用时间范围、账户、标签等多重过滤条件
 */
const filteredData = computed(() => {
  return store.transactions.filter(t => {
    const tDate = parseISO(t.date);
    const start = startOfDay(parseISO(filterStartDate.value));
    const end = endOfDay(parseISO(filterEndDate.value));
    
    // 1. 时间筛选
    const dateMatch = isWithinInterval(tDate, { start, end });
    if (!dateMatch) return false;

    // 2. 账户筛选
    if (selectedAccountIds.value.length > 0) {
      if (!selectedAccountIds.value.includes(t.accountId || '1')) return false;
    }

    // 3. 标签筛选
    if (selectedTags.value.length > 0) {
      if (!t.tags || t.tags.length === 0) return false;
      const tagMatch = selectedTags.value.some(tag => t.tags.includes(tag));
      if (!tagMatch) return false;
    }

    return true;
  });
});

/**
 * 筛选后的收支汇总统计
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
 * 饼图配置选项 (ECharts Option)
 * 动态计算当前筛选下的分类占比数据，并支持分类下钻逻辑
 */
const pieChartOption = computed(() => {
  const transactions = filteredData.value.filter(t => t.type === chartType.value);
  
  let data: { name: string, value: number, id: string }[] = [];
  
  if (!drilldownCategoryId.value) {
    // 顶层分类统计：将所有交易归类到它们的顶层父分类
    const summaryMap: Record<string, number> = {};
    transactions.forEach(t => {
      const { category, parent } = store.findCategoryWithParent(t.categoryId);
      const topLevelId = parent ? String(parent.id) : String(t.categoryId);
      if (topLevelId) {
        summaryMap[topLevelId] = (summaryMap[topLevelId] || 0) + Number(t.amount);
      }
    });
    
    data = Object.entries(summaryMap).map(([id, value]) => ({
      id,
      name: getCategoryName(id),
      value
    }));
  } else {
    // 子分类下钻统计：统计选中父分类下的所有子分类
    const parentId = String(drilldownCategoryId.value);
    const summaryMap: Record<string, number> = {};
    
    transactions.forEach(t => {
      const { category, parent } = store.findCategoryWithParent(t.categoryId);
      // 如果该交易属于当前下钻的父分类
      if (String(t.categoryId) === parentId || (parent && String(parent.id) === parentId)) {
        // 如果是子分类记录，则按子分类统计；如果是父分类本身记录，则归入“其他”
        const subId = (parent && String(parent.id) === parentId) ? String(t.categoryId) : 'other';
        summaryMap[subId] = (summaryMap[subId] || 0) + Number(t.amount);
      }
    });
    
    data = Object.entries(summaryMap).map(([id, value]) => ({
      id,
      name: id === 'other' ? '其他' : getCategoryName(id),
      value
    }));
  }

  // 按金额从大到小排序
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
      legend: { show: false }, // 隐藏图例，因为标签已经包含了所有信息
      series: [{
        name: '分类金额',
        type: 'pie',
        radius: ['35%', '60%'], // 稍微缩小饼图半径，为外部标签留出更多空间
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { 
          show: true, 
          position: 'outside',
          formatter: '{b}: {d}%',
          color: '#475569',
          fontSize: 12
        },
        emphasis: { 
          label: { 
            show: true, 
            fontSize: 16, 
            fontWeight: 'bold' 
          } 
        },
        labelLine: { 
          show: true,
          length: 15,
          length2: 10
        },
        data: data
      }]
  };
});

/**
 * 折线图配置选项 (ECharts Option)
 * 展示收支随时间的变化趋势
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
 * 处理饼图点击事件，执行分类下钻
 */
const onPieClick = (params: any) => {
  if (!drilldownCategoryId.value) {
    const category = store.findCategoryById(params.data.id);
    // 仅当分类有子类时允许下钻
    if (category && category.children && category.children.length > 0) {
      drilldownCategoryId.value = params.data.id;
    }
  }
};

/**
 * 返回上一层分类（重置下钻）
 */
const goBackToTopLevel = () => { drilldownCategoryId.value = null; };

/**
 * 切换账户筛选状态
 * @param id 账户ID
 */
const toggleAccount = (id: string) => {
  const index = selectedAccountIds.value.indexOf(id);
  if (index === -1) selectedAccountIds.value.push(id);
  else selectedAccountIds.value.splice(index, 1);
};

/**
 * 切换标签筛选状态
 * @param tag 标签名称
 */
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index === -1) selectedTags.value.push(tag);
  else selectedTags.value.splice(index, 1);
};

/**
 * 重置所有筛选条件到默认值
 */
const resetFilters = () => {
  filterStartDate.value = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  filterEndDate.value = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  selectedAccountIds.value = [];
  selectedTags.value = [];
};

/**
 * 导出 PDF 报表流程
 * 采用 html2canvas 将页面内容转为图片，再通过 jsPDF 生成 PDF 文件
 */
const isExporting = ref(false); // 导出状态标识
const exportToPDF = async () => {
  if (isExporting.value) return;
  
  isExporting.value = true;
  store.addNotification('正在准备报表数据...', 'info');

  try {
    const element = document.getElementById('report-content');
    if (!element) throw new Error('找不到报表内容区域');

    store.addNotification('正在生成报表图片，请稍候...', 'info');

    // 等待图表渲染完全稳定
    await new Promise(resolve => setTimeout(resolve, 800));

    const canvas = await html2canvas(element, {
      scale: 2, // 2倍缩放以保证高清打印
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
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
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4'); // 创建 A4 纸张大小的 PDF
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const margin = 10; // 页面边距 10mm
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
    
    let position = margin;

    // 将生成的图片添加到 PDF
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    
    // 生成文件名并触发下载
    const fileName = `财务报表_${filterStartDate.value}_至_${filterEndDate.value}.pdf`;
    pdf.save(fileName);
    
    store.addNotification('PDF 报表导出成功', 'success');
  } catch (error) {
    console.error('PDF Export Error:', error);
    store.addNotification('导出失败，请重试', 'error');
  } finally {
    isExporting.value = false;
  }
};

/**
 * 导出账单数据到 Excel
 * 将当前筛选后的交易记录转换为 Excel 表格并下载
 */
const isExportingExcel = ref(false);
const exportToExcel = () => {
  if (isExportingExcel.value) return;
  if (filteredData.value.length === 0) {
    store.addNotification('当前筛选条件下无数据可导出', 'warning');
    return;
  }

  isExportingExcel.value = true;
  store.addNotification('正在准备 Excel 数据...', 'info');

  try {
    // 准备 Excel 表头和数据映射
    const excelData = filteredData.value.map(t => {
      const { category, parent } = store.findCategoryWithParent(t.categoryId);
      return {
        '日期': t.date ? format(parseISO(t.date), 'yyyy-MM-dd HH:mm') : '-',
        '类型': t.type === 'income' ? '收入' : (t.type === 'expense' ? '支出' : '转账'),
        '分类': parent ? parent.name : (category?.name || (t.type === 'transfer' ? '转账' : '未知')),
        '子分类': parent ? category?.name : '-',
        '说明': t.note || '-',
        '账户': store.accounts.find(a => a.id === (t.accountId || '1'))?.name || '默认账户',
        '金额': Number(t.amount).toFixed(2),
        '标签': t.tags ? t.tags.join(', ') : '-'
      };
    });

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // 设置列宽
    const colWidths = [
      { wch: 18 }, // 日期
      { wch: 8 },  // 类型
      { wch: 12 }, // 分类
      { wch: 12 }, // 子分类
      { wch: 25 }, // 说明
      { wch: 15 }, // 账户
      { wch: 12 }, // 金额
      { wch: 20 }  // 标签
    ];
    worksheet['!cols'] = colWidths;

    // 创建工作簿并添加工作表
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '账单明细');

    // 生成文件名并下载
    const fileName = `账单明细_${filterStartDate.value}_至_${filterEndDate.value}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    store.addNotification('Excel 导出成功', 'success');
  } catch (error) {
    console.error('Excel Export Error:', error);
    store.addNotification('导出 Excel 失败，请重试', 'error');
  } finally {
    isExportingExcel.value = false;
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
            @click="exportToExcel"
            :disabled="isExportingExcel"
            class="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download v-if="!isExportingExcel" :size="18" />
            <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            导出 Excel
          </button>
          <button 
            @click="exportToPDF"
            :disabled="isExporting"
            class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <Transition name="slide-down">
        <div v-if="showFilterPanel" class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- 时间范围 -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <CalendarIcon :size="16" /> 时间范围
            </label>
            <div class="flex items-center gap-2">
              <BaseDatePicker 
                v-model="filterStartDate"
                class="flex-1"
              />
              <ArrowRight :size="16" class="text-slate-400" />
              <BaseDatePicker 
                v-model="filterEndDate"
                class="flex-1"
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
      </Transition>

      <!-- 报表导出内容区域 -->
      <div id="report-content" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <!-- 报表头部重新设计 -->
        <div class="p-8 border-b border-slate-100">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                <Wallet :size="28" />
              </div>
              <div>
                <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">个人财务报表</h2>
                <div class="flex items-center gap-2 mt-1">
                  <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p class="text-slate-500 text-xs font-medium">生成时间：{{ format(new Date(), 'yyyy-MM-dd HH:mm') }}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/60 flex items-center gap-3">
              <div class="p-2 bg-white rounded-lg shadow-sm">
                <CalendarIcon :size="18" class="text-slate-400" />
              </div>
              <div>
                <div class="text-slate-400 text-[10px] uppercase font-bold tracking-widest leading-none mb-1">统计周期</div>
                <div class="text-sm font-semibold text-slate-700">{{ filterStartDate }} <span class="text-slate-300 mx-1">至</span> {{ filterEndDate }}</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- 总收入卡片 -->
            <div class="relative overflow-hidden group p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 transition-all hover:shadow-md">
              <div class="absolute -right-4 -bottom-4 text-emerald-100 group-hover:text-emerald-200/80 transition-colors">
                <TrendingUp :size="100" />
              </div>
              <div class="relative z-10">
                <div class="flex items-center gap-2 text-emerald-600 mb-3">
                  <div class="p-1.5 bg-white rounded-lg shadow-sm border border-emerald-100">
                    <TrendingUp :size="16" />
                  </div>
                  <span class="text-xs font-bold uppercase tracking-wider">总收入</span>
                </div>
                <div class="text-3xl font-black text-slate-900">
                  <span class="text-lg font-bold text-emerald-600 mr-1">¥</span>{{ summary.income.toLocaleString() }}
                </div>
              </div>
            </div>

            <!-- 总支出卡片 -->
            <div class="relative overflow-hidden group p-6 rounded-2xl bg-rose-50/50 border border-rose-100 transition-all hover:shadow-md">
              <div class="absolute -right-4 -bottom-4 text-rose-100 group-hover:text-rose-200/80 transition-colors">
                <CreditCard :size="100" />
              </div>
              <div class="relative z-10">
                <div class="flex items-center gap-2 text-rose-600 mb-3">
                  <div class="p-1.5 bg-white rounded-lg shadow-sm border border-rose-100">
                    <CreditCard :size="16" />
                  </div>
                  <span class="text-xs font-bold uppercase tracking-wider">总支出</span>
                </div>
                <div class="text-3xl font-black text-slate-900">
                  <span class="text-lg font-bold text-rose-600 mr-1">¥</span>{{ summary.expense.toLocaleString() }}
                </div>
              </div>
            </div>

            <!-- 净收支卡片 -->
            <div class="relative overflow-hidden group p-6 rounded-2xl bg-primary-50/50 border border-primary-100 transition-all hover:shadow-md">
              <div class="absolute -right-4 -bottom-4 text-primary-100 group-hover:text-primary-200/80 transition-colors">
                <BarChart3 :size="100" />
              </div>
              <div class="relative z-10">
                <div class="flex items-center gap-2 text-primary-600 mb-3">
                  <div class="p-1.5 bg-white rounded-lg shadow-sm border border-primary-100">
                    <BarChart3 :size="16" />
                  </div>
                  <span class="text-xs font-bold uppercase tracking-wider">净收支</span>
                </div>
                <div class="text-3xl font-black text-slate-900" :class="summary.balance >= 0 ? 'text-slate-900' : 'text-rose-700'">
                  <span class="text-lg font-bold text-primary-600 mr-1">¥</span>{{ summary.balance.toLocaleString() }}
                </div>
              </div>
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
                      {{ getFullCategoryName(t.categoryId) }}
                    </td>
                    <td class="py-4 px-4 text-slate-600">{{ t.note || '-' }}</td>
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
