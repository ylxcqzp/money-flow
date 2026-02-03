/**
 * PostCSS 配置文件
 * 用于配置 CSS 后处理插件，如 Tailwind CSS 和 Autoprefixer
 */
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // 集成 Tailwind CSS
    autoprefixer: {},           // 自动添加浏览器厂商前缀
  },
}
