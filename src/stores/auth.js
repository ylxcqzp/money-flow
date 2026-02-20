import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authApi from '@/api/auth'
import { useNotificationStore } from './notification'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('money-flow-access-token') || '')
  const refreshToken = ref(localStorage.getItem('money-flow-refresh-token') || '')
  const userStr = localStorage.getItem('money-flow-user')
  const user = ref(userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null)
  const notificationStore = useNotificationStore()

  /**
   * 身份认证状态
   */
  const isAuthenticated = computed(() => !!accessToken.value)

  /**
   * 统一设置认证数据
   * @param {Object} data 认证响应数据
   * @param {string} data.accessToken 访问令牌
   * @param {string} [data.refreshToken] 刷新令牌
   * @param {Object} [data.user] 用户信息对象
   */
  const setAuthData = (data) => {
    accessToken.value = data.accessToken || data.token
    refreshToken.value = data.refreshToken
    
    const u = data.user || {}
    user.value = {
      ...u,
      name: u.nickname || u.username || u.name || '',
      avatar: u.avatarUrl || u.avatar_url || u.avatar || ''
    }
    
    localStorage.setItem('money-flow-access-token', accessToken.value)
    if (refreshToken.value) {
      localStorage.setItem('money-flow-refresh-token', refreshToken.value)
    }
    localStorage.setItem('money-flow-user', JSON.stringify(user.value))
  }

  /**
   * 登录方法
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password })
      const data = res.data || res
      
      setAuthData(data)
      
      notificationStore.success('登录成功，欢迎回来！')
      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * 发送验证码
   * @param {string} email 
   */
  const sendCode = async (email) => {
    try {
      await authApi.sendVerifyCode({ email })
      notificationStore.success('验证码已发送至您的邮箱，请查收')
      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * 注册方法
   * @param {string} username
   * @param {string} email 
   * @param {string} password 
   * @param {string} code
   */
  const register = async (username, email, password, code) => {
    try {
      const res = await authApi.register({ username, email, password, code })
      return res.data || res
    } catch (error) {
      throw error
    }
  }

  /**
   * 刷新 Token
   */
  const refresh = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }
      
      const res = await authApi.refreshToken({ refreshToken: refreshToken.value })
      const data = res.data || res
      
      setAuthData(data)
      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * 退出登录
   * 清除本地存储的 Token 和用户信息
   * @param {boolean} silent 是否静默退出（不显示通知），默认为 false
   */
  const logout = async (silent = false) => {
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    
    localStorage.removeItem('money-flow-access-token')
    localStorage.removeItem('money-flow-refresh-token')
    localStorage.removeItem('money-flow-user')
    
    if (!silent) {
      notificationStore.success('已安全退出')
    }
    return true
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    login,
    sendCode,
    register,
    refresh,
    logout,
    setAuthData
  }
})
