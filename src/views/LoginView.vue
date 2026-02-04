<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import { Wallet, Mail, Lock, User, ArrowRight, Loader2, Check, X, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const isLogin = ref(true) // true: 登录, false: 注册
const isLoading = ref(false)

const form = ref({
  email: 'demo@example.com',
  password: 'password123',
  name: ''
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  // 切换模式时保留邮箱，清空密码
  form.value.password = ''
  if (!isLogin.value) {
    form.value.name = ''
  }
}

const handleSubmit = async () => {
  isLoading.value = true
  
  try {
    if (isLogin.value) {
      await authStore.login(form.value.email, form.value.password)
    } else {
      await authStore.register(form.value.email, form.value.password, form.value.name)
    }
    router.push('/')
  } catch (err) {
    // 错误已在 authStore 中通过通知显示
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[600px]">
      
      <!-- 左侧品牌区域 -->
      <div class="md:w-1/2 bg-gradient-to-br from-primary-600 to-emerald-800 p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <!-- 装饰背景 -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
        <div class="relative z-10">
          <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
            <Wallet :size="28" class="text-white" />
          </div>
          <h1 class="text-4xl font-bold mb-4">Money Flow</h1>
          <p class="text-emerald-100 text-lg leading-relaxed">
            掌控您的财务生活，<br>让每一笔收支都清晰可见。
          </p>
        </div>
        
        <div class="relative z-10 text-sm text-emerald-200/80">
          &copy; 2026 Money Flow Inc.
        </div>
      </div>
      
      <!-- 右侧表单区域 -->
      <div class="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
        <div class="max-w-sm mx-auto w-full">
          <h2 class="text-2xl font-bold text-slate-800 mb-2">
            {{ isLogin ? '欢迎回来' : '创建账户' }}
          </h2>
          <p class="text-slate-500 mb-8">
            {{ isLogin ? '请输入您的账号信息以登录' : '开始您的财务自由之旅' }}
          </p>
          
          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div v-if="!isLogin" class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label class="text-xs font-semibold text-slate-700 ml-1">昵称</label>
              <div class="relative group">
                <User :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  v-model="form.name"
                  type="text" 
                  required
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="您的称呼"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700 ml-1">邮箱</label>
              <div class="relative group">
                <Mail :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  v-model="form.email"
                  type="email" 
                  required
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700 ml-1">密码</label>
              <div class="relative group">
                <Lock :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  v-model="form.password"
                  type="password" 
                  required
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              :disabled="isLoading"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isLoading" class="animate-spin" :size="20" />
              <span v-else>{{ isLogin ? '登录' : '立即注册' }}</span>
              <ArrowRight v-if="!isLoading" :size="18" />
            </button>
          </form>
          
          <div class="mt-8 text-center">
            <p class="text-sm text-slate-500">
              {{ isLogin ? '还没有账号？' : '已有账号？' }}
              <button 
                @click="toggleMode"
                class="font-bold text-primary-600 hover:text-primary-700 hover:underline transition-all"
              >
                {{ isLogin ? '去注册' : '去登录' }}
              </button>
            </p>
          </div>

          <!-- 测试账号提示 -->
          <div v-if="isLogin" class="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
            <p class="font-semibold mb-1 text-slate-700">测试账号 (点击复制):</p>
            <div class="flex items-center justify-between cursor-pointer hover:text-primary-600 transition-colors" @click="form.email = 'demo@example.com'; form.password = 'password123'">
              <span>Email: demo@example.com</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Password: password123</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications Toast -->
    <div class="fixed top-6 right-6 z-[200] space-y-3 pointer-events-none w-full max-w-sm">
      <TransitionGroup 
        enter-active-class="transform transition ease-out duration-300"
        enter-from-class="translate-y-[-20px] translate-x-[20px] opacity-0"
        enter-to-class="translate-y-0 translate-x-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div 
          v-for="n in notificationStore.notifications" 
          :key="n.id"
          class="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 rounded-2xl flex items-start gap-4 group"
        >
          <div 
            class="p-2.5 rounded-xl shrink-0 shadow-sm"
            :class="{
              'bg-emerald-100 text-emerald-600': n.type === 'success',
              'bg-rose-100 text-rose-600': n.type === 'error',
              'bg-amber-100 text-amber-600': n.type === 'warning',
              'bg-blue-100 text-blue-600': n.type === 'info'
            }"
          >
            <component :is="n.type === 'success' ? Check : (n.type === 'error' ? X : AlertCircle)" :size="20" stroke-width="2.5" />
          </div>
          <div class="flex-1 pt-0.5">
            <h4 class="text-sm font-bold text-slate-800 leading-tight">{{ n.type === 'success' ? '操作成功' : (n.type === 'error' ? '操作失败' : '系统提示') }}</h4>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ n.message }}</p>
          </div>
          <button @click="notificationStore.removeNotification(n.id)" class="text-slate-300 hover:text-slate-500 p-1 hover:bg-slate-50 rounded-lg transition-colors">
            <X :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
