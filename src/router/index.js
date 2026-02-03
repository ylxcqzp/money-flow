/**
 * 路由配置文件
 * 定义应用的所有路由跳转规则
 */
import { createRouter, createWebHistory } from 'vue-router'

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
        component: () => import('../views/Dashboard.vue')
    },
    {
        path: '/statistics',
        name: 'Statistics',
        // 数据分析统计页
        component: () => import('../views/Statistics.vue')
    },
]

/**
 * 创建路由实例
 * 使用 Web History 模式
 */
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
