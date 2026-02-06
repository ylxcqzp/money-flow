import request from '@/utils/request'

function mapTransactionRequest(data) {
  const isTransfer = data.type === 'transfer'
  const payload = {}
  // 通用字段
  payload.type = data.type
  payload.amount = Number(data.amount)
  payload.currency = data.currency
  // 日期标准化为 'YYYY-MM-DD'
  const dateStr = typeof data.date === 'string' ? data.date : ''
  payload.date = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr
  // 备注字段
  payload.note = data.description || data.note || ''
  // 原币种金额
  if (data.originalAmount != null) payload.originalAmount = Number(data.originalAmount)
  // 分类：优先使用子分类
  const catId = data.subCategoryId || data.categoryId
  if (catId) payload.categoryId = catId
  // 账户映射
  if (isTransfer) {
    payload.fromAccountId = data.fromAccountId || data.accountId
    payload.toAccountId = data.toAccountId
  } else {
    payload.accountId = data.accountId
  }
  // 标签：支持数组或逗号字符串
  if (Array.isArray(data.tags)) {
    payload.tags = data.tags
  } else if (typeof data.tags === 'string') {
    payload.tags = data.tags.split(',').map(s => s.trim()).filter(Boolean)
  }
  return payload
}

function mapTransactionResponse(item) {
  if (!item) return item
  const t = { ...item }
  // 字段回映射为前端使用的 camelCase
  if ('category_id' in t) t.categoryId = t.category_id
  if ('account_id' in t) t.accountId = t.account_id
  if ('target_account_id' in t) {
    t.toAccountId = t.target_account_id
    // 转账的来源账户
    t.fromAccountId = t.account_id
  }
  if ('note' in t) t.description = t.note
  if ('orig_amount' in t) t.originalAmount = t.orig_amount
  // 统一 tags 为数组
  if (typeof t.tags === 'string') {
    t.tags = t.tags.split(',').map(s => s.trim()).filter(Boolean)
  }
  return t
}

export default {
  /**
   * 获取交易列表
   * @param {Object} params { startDate, endDate, type, categoryId, accountId, page, size }
   */
  getTransactions(params) {
    const mappedParams = { ...(params || {}) }
    return request({
      url: '/transactions',
      method: 'get',
      params: mappedParams
    }).then(res => {
      const data = res.data || res
      return Array.isArray(data) ? data.map(mapTransactionResponse) : data
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
    }).then(res => {
      const data = res.data || res
      return mapTransactionResponse(data)
    })
  },

  /**
   * 创建交易
   * @param {Object} data 交易信息
   */
  createTransaction(data) {
    const payload = mapTransactionRequest(data)
    return request({
      url: '/transactions',
      method: 'post',
      data: payload
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
