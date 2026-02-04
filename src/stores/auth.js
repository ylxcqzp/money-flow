import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 预设用户数据，尝试从本地存储恢复
  const user = ref(JSON.parse(localStorage.getItem('money-flow-user')) || null)
  
  // 硬编码的测试账号
  const TEST_ACCOUNT = {
    email: 'demo@example.com',
    password: 'password123',
    name: 'Admin User',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D9488&color=fff'
  }

  /**
   * 登录方法
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (email === TEST_ACCOUNT.email && password === TEST_ACCOUNT.password) {
      user.value = {
        email: TEST_ACCOUNT.email,
        name: TEST_ACCOUNT.name,
        avatar: TEST_ACCOUNT.avatar,
        token: 'mock-token-' + Date.now()
      }
      localStorage.setItem('money-flow-user', JSON.stringify(user.value))
      return true
    }
    throw new Error('邮箱或密码错误')
  }

  /**
   * 注册方法
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   */
  const register = async (email, password, name) => {
    // 模拟注册延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 注册成功后直接登录
    user.value = {
      email,
      name: name || email.split('@')[0],
      avatar: `https://ui-avatars.com/api/?name=${name || email}&background=0D9488&color=fff`,
      token: 'mock-token-' + Date.now()
    }
    localStorage.setItem('money-flow-user', JSON.stringify(user.value))
    return true
  }

  /**
   * 退出登录
   */
  const logout = () => {
    user.value = null
    localStorage.removeItem('money-flow-user')
  }

  return {
    user,
    login,
    register,
    logout,
    TEST_ACCOUNT
  }
})
