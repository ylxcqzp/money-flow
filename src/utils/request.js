import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 创建 axios 实例
const service = axios.create({
  // 后端 API 地址配置
  baseURL: 'http://localhost:8081/api',
  timeout: 10000 // 请求超时时间
})

// request 拦截器
service.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    // 如果存在 token，则添加到 Header 中
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return config
  },
  error => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  response => {
    // 假设后端返回格式为 { code: 200, msg: 'success', data: ... }
    // 如果是 RESTful 标准，可能直接返回数据或状态码
    // 这里做一层简单的处理，如果后端遵循统一响应结构
    const res = response.data

    // 如果是二进制数据（如导出文件），直接返回
    if (response.config.responseType === 'blob') {
      return res
    }
    
    // 这里可以根据后端的约定进行调整
    // 例如：如果 code !== 200 则视为错误
    // 目前暂且直接返回 response.data，由调用方处理业务逻辑
    return res
  },
  error => {
    console.error('Response Error:', error)
    
    const { response } = error
    if (response) {
      // 401 未授权，清除 token 并跳转登录页
      if (response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/login')
      }
      // 可以添加其他状态码的处理...
    }
    
    return Promise.reject(error)
  }
)

export default service
