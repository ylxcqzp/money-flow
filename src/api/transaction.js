import request from '@/utils/request'

export default {
  /**
   * 获取交易列表
   * @param {Object} params { startDate, endDate, type, categoryId, accountId, tags }
   */
  getTransactions(params) {
    return request({
      url: '/transactions',
      method: 'get',
      params
    })
  },

  /**
   * 获取交易详情
   * @param {Number} id 交易ID
   */
  getTransaction(id) {
    return request({
      url: `/transactions/${id}`,
      method: 'get'
    })
  },

  /**
   * 创建交易
   * @param {Object} data 交易信息
   */
  createTransaction(data) {
    return request({
      url: '/transactions',
      method: 'post',
      data
    })
  },

  /**
   * 更新交易
   * @param {Number} id 交易ID
   * @param {Object} data 更新信息
   */
  updateTransaction(id, data) {
    const payload = mapTransactionRequest(data)
    return request({
      url: `/transactions/${id}`,
      method: 'put',
      data: payload
    })
  },

  /**
   * 删除交易
   * @param {Number} id 交易ID
   */
  deleteTransaction(id) {
    return request({
      url: `/transactions/${id}`,
      method: 'delete'
    })
  },

  /**
   * 获取统计数据
   * @param {Object} params { startDate, endDate, type }
   */
  getStats(params) {
    const mappedParams = { ...(params || {}) }
    return request({
      url: '/transactions/stats',
      method: 'get',
      params: mappedParams
    })
  }
}
