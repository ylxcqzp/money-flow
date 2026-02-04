import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])

  /**
   * 添加通知
   * @param {string} message 通知消息内容
   * @param {string} type 通知类型: 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration 显示时长（毫秒），默认 3000ms
   */
  function addNotification(message, type = 'info', duration = 3000) {
    const id = Date.now()
    notifications.value.push({ id, message, type })
    
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration)
    }
    
    return id
  }

  /**
   * 移除指定通知
   * @param {number} id 通知 ID
   */
  function removeNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  /**
   * 清除所有通知
   */
  function clearAll() {
    notifications.value = []
  }

  /**
   * 添加成功通知
   * @param {string} message 消息内容
   * @param {number} duration 显示时长
   */
  function success(message, duration = 3000) {
    return addNotification(message, 'success', duration)
  }

  /**
   * 添加错误通知
   * @param {string} message 消息内容
   * @param {number} duration 显示时长
   */
  function error(message, duration = 5000) {
    return addNotification(message, 'error', duration)
  }

  /**
   * 添加警告通知
   * @param {string} message 消息内容
   * @param {number} duration 显示时长
   */
  function warning(message, duration = 4000) {
    return addNotification(message, 'warning', duration)
  }

  /**
   * 添加信息通知
   * @param {string} message 消息内容
   * @param {number} duration 显示时长
   */
  function info(message, duration = 3000) {
    return addNotification(message, 'info', duration)
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
})
