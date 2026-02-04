import request from '@/utils/request'

export default {
  /**
   * 获取某月的预算
   * @param {String} month 'YYYY-MM'
   */
  getBudget(month) {
    return request({
      url: '/budgets',
      method: 'get',
      params: { month }
    })
  },

  /**
   * 设置/更新预算
   * @param {Object} data 预算信息
   */
  saveBudget(data) {
    return request({
      url: '/budgets',
      method: 'post',
      data
    })
  }
}
