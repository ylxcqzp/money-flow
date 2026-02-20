/**
 * 路由配置文件
 * 定义应用的所有路由跳转规则
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/**
 * 路由表配置
 * path: 访问路径
 * name: 路由名称
 * component: 路由对应的页面组件，使用懒加载模式提高首屏加载速度
 */
const routes = [
    {
        path: '/',
        name: 'Dashboard',
        // 首页仪表盘
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/statistics',
        name: 'Statistics',
        // 数据分析统计页
        component: () => import('../views/Statistics.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'Login',
        // 登录注册页
        component: () => import('../views/LoginView.vue'),
        meta: { requiresAuth: false }
    }
]

/**
 * 创建路由实例
 * 使用 Web History 模式
 */
const router = createRouter({
    history: createWebHistory(),
    routes
})

/**
 * 全局前置守卫
 * 负责路由跳转前的权限验证
 * @param {RouteLocationNormalized} to 即将要进入的目标路由对象
 * @param {RouteLocationNormalized} from 当前导航正要离开的路由
 * @param {NavigationGuardNext} next 放行函数
 */
router.beforeEach((to, from, next) => {
    // 注意：Pinia store 必须在 router 钩子内部调用，否则会报错
    const authStore = useAuthStore()
    
    // 检查目标路由是否需要认证
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        // 需要登录但未登录 -> 重定向到登录页
        next('/login')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        // 已登录但尝试访问登录页 -> 重定向到首页
        next('/')
    } else {
        // 正常放行
        next()
    }
})

export default router
