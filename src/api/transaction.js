import request from '@/utils/request'

// 简单的请求数据映射函数，目前作为透传使用
// 如果将来需要对提交的数据进行转换（例如格式化日期），可以在这里处理
const mapTransactionRequest = (data) => {
  return { ...data }
}

export default {
  /**
   * 获取交易列表
   * @param {Object} params 查询参数
   * @param {string} [params.startDate] 开始日期 (YYYY-MM-DD)
   * @param {string} [params.endDate] 结束日期 (YYYY-MM-DD)
   * @param {string} [params.type] 交易类型 (expense/income/transfer/all)
   * @param {string} [params.categoryId] 分类ID
   * @param {string} [params.accountId] 账户ID
   * @param {string} [params.tags] 标签列表 (逗号分隔)
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
