import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { toast } from 'vue3-toastify'

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
    toast.error('请求发送失败，请检查网络')
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
    
    // 处理后端返回的业务状态码
    // 约定: code === 0 为成功，其他为异常
    if (res.code !== 0) {
        // 如果是 401，可能是 token 过期
        if (res.code === 401) {
            // 如果是登录接口本身的 401，不执行 logout，只提示错误
            const isAuthRequest = response.config.url.includes('/login') || response.config.url.includes('/register')
            
            if (!isAuthRequest) {
                const authStore = useAuthStore()
                authStore.logout().then(() => {
                    router.push('/login')
                    // 非登录接口的 401，通常意味着 token 失效，提示用户
                    toast.error('登录已过期，请重新登录')
                })
                return Promise.reject(new Error('Unauthorized'))
            }
        }
        
        // 映射后端错误码到中文提示
        let errorMessage = res.message || '请求失败'
        
        switch (res.code) {
            case 400: // INVALID_PARAM
                errorMessage = res.message || '参数校验错误'
                break
            case 401: // UNAUTHORIZED
                errorMessage = res.message || '未认证或认证失败'
                break
            case 403: // FORBIDDEN
                errorMessage = res.message || '无权限访问'
                break
            case 409: // CONFLICT
                errorMessage = res.message || '业务冲突'
                break
            case 500: // INTERNAL_ERROR
                errorMessage = res.message || '系统内部错误'
                break
            default:
                break
        }

        toast.error(errorMessage)
        
        // 返回 rejected promise，中断后续操作
        return Promise.reject(new Error(errorMessage))
    }
    
    // 如果 code === 0，返回 data 部分 (或者整个 res，视项目习惯而定)
    // 通常返回 res.data 方便直接使用数据，但有时需要 code
    // 这里如果之前代码是 return res，那可能前端直接用了 res.data
    // 根据之前的代码 `const res = response.data` 和 `return res`，
    // 之前的返回值是整个 { code, message, data } 对象。
    // 为了保持兼容性，继续返回 res
    return res
  },
  error => {
    console.error('Response Error:', error)
    
    const { response } = error
    let message = '请求失败，请稍后重试'

    if (response) {
      // 401 未授权，清除 token 并跳转登录页
      if (response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout().then(() => {
          router.push('/login')
        })
        message = '登录已过期，请重新登录'
      } else if (response.status === 403) {
        message = '您没有权限执行此操作'
      } else if (response.status === 404) {
        message = '请求的资源不存在'
      } else if (response.status === 500) {
        message = '服务器内部错误'
      } else if (response.data && response.data.message) {
        // 优先使用后端返回的错误信息
        message = response.data.message
      }
    } else if (error.message.includes('timeout')) {
        message = '请求超时，请检查网络'
    } else if (error.message.includes('Network Error')) {
        message = '网络连接异常，请检查网络'
    }
    
    toast.error(message)
    return Promise.reject(error)
  }
)

export default service
