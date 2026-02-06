import request from '@/utils/request'

function mapRecurringRequest(data) {
  const payload = { ...data }
  if ('amount' in payload) payload.amount = Number(payload.amount)
  if (payload.startDate) {
    const dateStr = typeof payload.startDate === 'string' ? payload.startDate : ''
    payload.startDate = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr
  }
  const catId = payload.subCategoryId || payload.categoryId
  if (catId) payload.categoryId = catId
  delete payload.description
  return payload
}

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
    const payload = mapRecurringRequest(data)
    return request({
      url: '/recurring-rules',
      method: 'post',
      data: payload
    })
  },

  /**
   * 更新周期性规则
   * @param {Number} id 规则ID
   * @param {Object} data 更新信息
   */
  updateRule(id, data) {
    const payload = mapRecurringRequest(data)
    return request({
      url: `/recurring-rules/${id}`,
      method: 'put',
      data: payload
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
  },

  /**
   * 生成周期性交易
   * 触发后端检查所有周期性规则，自动生成符合条件的交易记录
   */
  generateTransactions() {
    return request({
      url: '/recurring-rules/generate',
      method: 'post'
    })
  }
}
