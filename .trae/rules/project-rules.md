# Money Flow 项目规则

## 技术栈规范
- **框架**: [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`)
- **构建工具**: [Vite](https://vitejs.dev/)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/) (使用 PostCSS 插件)
- **状态管理**: [Pinia](https://pinia.vuejs.org/) (Setup Store 模式)
- **路由**: [Vue Router 4](https://router.vuejs.org/)
- **图标**: [Lucide Vue Next](https://lucide.dev/guide/packages/lucide-vue-next)
- **图表**: [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/)
- **日期处理**: [date-fns](https://date-fns.org/)

## 开发规范
- **组件风格**: 
    - 统一使用 `PascalCase` 命名组件文件和组件引用。
    - 优先使用单文件组件 (SFC)。
    - 逻辑部分必须放置在 `<script setup>` 中。
- **状态管理**:
    - 业务逻辑和持久化数据应放在 Pinia Store 中。
    - 优先使用 `ref` 定义状态，`computed` 处理派生状态。
- **样式管理**:
    - 严格遵循 Tailwind CSS 实用类优先原则。
    - 避免编写自定义 CSS，除非 Tailwind 无法实现。
    - 使用 CSS 变量管理品牌色和主题色。
- **类型安全**:
    - 新编写的代码必须使用 TypeScript。
    - 严格定义 Props、Emits 和接口模型。
- **性能优化**:
    - 长列表渲染使用 `v-memo` 或虚拟列表。
    - 复杂计算必须使用 `computed` 进行缓存。
- **文档与注释**:
    - **需求同步**: 每当添加新的功能模块或逻辑变更后，必须及时将其记录并更新到需求文档中。每当有新的api接口，必须及时更新到api文档中。如果是修改了已有的接口或者功能也要及时更新到文档中。
    - **详细注释**: 所有生成的代码必须带有详尽的中文注释，包括但不限于函数用途、参数说明、返回值定义以及复杂的业务逻辑说明。

## 目录结构
- `src/components`: 业务通用组件
- `src/views`: 页面级组件
- `src/stores`: Pinia 状态仓库
- `src/router`: 路由配置
- `src/assets`: 静态资源 (图片、样式)
