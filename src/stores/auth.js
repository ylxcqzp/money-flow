import { defineStore } from 'pinia'
import { ref } from 'vue'
import authApi from '@/api/auth'
import { useNotificationStore } from './notification'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('money-flow-token') || '')
  const userStr = localStorage.getItem('money-flow-user')
  const user = ref(userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null)
  const notificationStore = useNotificationStore()

  /**
   * 登录方法
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password })
      // 假设后端返回结构: { token, user }
      // 如果是 { data: { token, user } } 请根据实际调整
      const data = res.data || res
      
      token.value = data.token
      const u = data.user || {}
      user.value = {
        ...u,
        name: u.nickname || u.username || u.name || '',
        avatar: u.avatar_url || u.avatar || ''
      }
      
      localStorage.setItem('money-flow-token', token.value)
      localStorage.setItem('money-flow-user', JSON.stringify(user.value))
      
      notificationStore.success('登录成功，欢迎回来！')
      return true
    } catch (error) {
      // notificationStore.error(error.message || '登录失败，请检查邮箱和密码')
      throw error
    }
  }

  /**
   * 注册方法
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   */
  const register = async (email, password, name) => {
    try {
      const res = await authApi.register({ email, password, username: name })
      const data = res.data || res
      
      token.value = data.token
      const u = data.user || {}
      user.value = {
        ...u,
        name: u.nickname || u.username || u.name || '',
        avatar: u.avatar_url || u.avatar || ''
      }
      
      localStorage.setItem('money-flow-token', token.value)
      localStorage.setItem('money-flow-user', JSON.stringify(user.value))
      
      notificationStore.success('注册成功，欢迎加入 Money Flow！')
      return true
    } catch (error) {
      // notificationStore.error(error.message || '注册失败，请稍后重试')
      throw error
    }
  }

  /**
   * 退出登录
   */
  const logout = async () => {
    try {
      // 调用后端退出接口
      await authApi.logout()
    } catch (error) {
      console.error('Logout API failed:', error)
    } finally {
      // 无论接口是否成功，都清除本地状态
      token.value = ''
      user.value = null
      localStorage.removeItem('money-flow-token')
      localStorage.removeItem('money-flow-user')
      
      // notificationStore.info('已退出登录')
    }
  }

  return {
    token,
    user,
    login,
    register,
    logout
  }
})
