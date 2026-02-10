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
    // 如果存在 accessToken，则添加到 Header 中
    if (authStore.accessToken) {
      config.headers['Authorization'] = `Bearer ${authStore.accessToken}`
    }
    return config
  },
  error => {
    console.error('Request Error:', error)
    toast.error('请求发送失败，请检查网络')
    return Promise.reject(error)
  }
)

// 是否正在刷新 token
let isRefreshing = false
// 重试队列
let requests = []

// response 拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 如果是二进制数据（如导出文件），直接返回
    if (response.config.responseType === 'blob') {
      return res
    }
    
    // 处理后端返回的业务状态码
    if (res.code !== 0) {
        // 如果是 401，可能是 token 过期
        if (res.code === 401) {
            const config = response.config
            // 如果是登录或刷新接口本身的 401，不执行自动刷新，直接报错
            if (config.url.includes('/auth/login') || config.url.includes('/auth/refresh') || config.url.includes('/auth/register')) {
                return Promise.reject(new Error(res.message || 'Authentication failed'))
            }

            const authStore = useAuthStore()
            
            if (!isRefreshing) {
                isRefreshing = true
                return authStore.refresh()
                    .then(token => {
                        // 刷新成功，重试队列中的请求
                        requests.forEach(cb => cb(token))
                        requests = []
                        // 重试当前请求
                        config.headers['Authorization'] = `Bearer ${token}`
                        return service(config)
                    })
                    .catch(err => {
                        // 刷新失败，清空队列并跳转登录
                        requests.forEach(cb => cb(null))
                        requests = []
                        
                        authStore.logout(false).then(() => {
                            router.push('/login')
                            toast.error('登录已过期，请重新登录')
                        })
                        return Promise.reject(err)
                    })
                    .finally(() => {
                        isRefreshing = false
                    })
            } else {
                // 正在刷新，将请求加入队列
                return new Promise(resolve => {
                    requests.push(token => {
                        if (token) {
                            config.headers['Authorization'] = `Bearer ${token}`
                            resolve(service(config))
                        } else {
                            // 刷新失败，resolve 一个 rejected promise 或者直接 reject
                            // 这里选择让外层 catch 到错误
                            resolve(Promise.reject(new Error('Token refresh failed')))
                        }
                    })
                })
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
            case 429: // TOO_MANY_REQUESTS
                errorMessage = res.message || '请求过于频繁，请稍后再试'
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
    
    return res
  },
  error => {
    // 处理 HTTP 状态码错误 (非 200)
    console.error('Response Error:', error)
    // 这里也可以处理 HTTP 401 (如果后端不是返回 200 + code: 401 而是直接返回 HTTP 401)
    // 目前根据文档，后端返回统一结构，状态码通常是 200，业务码在 body 中
    // 但为了健壮性，这里也应该处理一下 HTTP 401
    
    if (error.response && error.response.status === 401) {
       // 逻辑同上，但 axios error 结构不同，需要小心处理
       // 鉴于 API 文档描述的是统一响应结构，优先信任 response 拦截器中的逻辑
       // 这里仅作为兜底
    }
    
    toast.error(error.message || '网络请求失败')
    return Promise.reject(error)
  }
)

export default service
