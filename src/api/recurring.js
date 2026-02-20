import request from '@/utils/request'

export default {
  /**
   * 获取周期性规则列表
   */
  getRules() {
    return request({
      url: '/recurring-rules',
      method: 'get'
    })
  },

  /**
   * 创建周期性规则
   * @param {Object} data { type, amount, frequency, startDate, categoryId, accountId, description }
   */
  createRule(data) {
    return request({
      url: '/recurring-rules',
      method: 'post',
      data
    })
  },

  /**
   * 更新周期性规则
   * @param {Number} id 规则ID
   * @param {Object} data 更新信息
   */
  updateRule(id, data) {
    return request({
      url: `/recurring-rules/${id}`,
      method: 'put',
      data
    })
  },

  /**
   * 删除周期性规则
   * @param {Number} id 规则ID
   */
  deleteRule(id) {
    return request({
      url: `/recurring-rules/${id}`,
      method: 'delete'
    })
  }
}
