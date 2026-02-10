<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'
import { Wallet, Mail, Lock, ArrowRight, Loader2, KeyRound, User } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const isLogin = ref(true) // true: 登录, false: 注册
const isLoading = ref(false)

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  code: ''
})

const countdown = ref(0)
let timer = null

const toggleMode = () => {
  isLogin.value = !isLogin.value
  // 切换模式时清空所有字段，彻底防止浏览器保留填充状态
  form.value.email = ''
  form.value.password = ''
  form.value.confirmPassword = ''
  form.value.code = ''
}

const handleSendCode = async () => {
  if (!form.value.email) {
    notificationStore.warning('请输入邮箱')
    return
  }
  // Simple email regex check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    notificationStore.warning('请输入有效的邮箱地址')
    return
  }
  
  try {
    await authStore.sendCode(form.value.email)
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (err) {
    // handled in store
  }
}

const handleSubmit = async () => {
  if (!isLogin.value) {
    if (form.value.password !== form.value.confirmPassword) {
      notificationStore.warning('两次输入的密码不一致')
      return
    }
    if (!form.value.code) {
       notificationStore.warning('请输入验证码')
       return
    }
  }

  isLoading.value = true
  
  try {
    if (isLogin.value) {
      await authStore.login(form.value.email, form.value.password)
      router.push('/')
    } else {
      // 注册暂时用户名为邮箱
      const data = await authStore.register(form.value.email, form.value.email, form.value.password, form.value.code)
      
      // 如果注册接口返回了 token，则自动设置登录状态并跳转
      if (data && (data.accessToken || data.token)) {
        authStore.setAuthData(data)
        notificationStore.success('注册并登录成功！')
        router.push('/')
      } else {
        // 否则跳转到登录模式
        notificationStore.success('注册成功，请登录')
        toggleMode()
      }
    }
  } catch (err) {
    // 错误已在 authStore 中通过通知显示
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
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
      <div class="flex-1 p-8 md:p-12 flex flex-col justify-center relative bg-white">
        
        <div class="max-w-sm w-full mx-auto space-y-8">
          <h2 class="text-2xl font-bold text-slate-800 mb-2">
            {{ isLogin ? '欢迎回来' : '创建账户' }}
          </h2>
          <p class="text-slate-500 mb-8">
            {{ isLogin ? '请输入您的账号信息以登录' : '开始您的财务自由之旅' }}
          </p>
          
          <form @submit.prevent="handleSubmit" class="space-y-5" autocomplete="off">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-700 ml-1">邮箱</label>
              <div class="relative group">
                <Mail :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  v-if="isLogin"
                  key="login-email"
                  v-model="form.email"
                  type="email" 
                  required
                  autocomplete="email"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="name@example.com"
                />
                <input 
                  v-else
                  key="register-email"
                  v-model="form.email"
                  type="email" 
                  required
                  autocomplete="new-email-field"
                  name="new-email-field"
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
                  :autocomplete="isLogin ? 'current-password' : 'new-password'"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <!-- 确认密码 (仅注册模式) -->
            <div v-if="!isLogin" class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label class="text-xs font-semibold text-slate-700 ml-1">确认密码</label>
              <div class="relative group">
                <Lock :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  v-model="form.confirmPassword"
                  type="password" 
                  required
                  autocomplete="new-password"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="请再次输入密码"
                />
              </div>
            </div>

            <!-- 验证码 (仅注册模式) -->
            <div v-if="!isLogin" class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label class="text-xs font-semibold text-slate-700 ml-1">验证码</label>
              <div class="flex gap-2">
                <div class="relative group flex-1">
                  <KeyRound :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <input 
                    v-model="form.code"
                    type="text" 
                    required
                    autocomplete="one-time-code"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    placeholder="输入验证码"
                  />
                </div>
                <button 
                  type="button"
                  @click="handleSendCode"
                  :disabled="countdown > 0"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                >
                  {{ countdown > 0 ? `${countdown}s 后重试` : '获取验证码' }}
                </button>
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
        </div>
      </div>
    </div>
  </div>
</template>