import request from '@/utils/request'

function mapBudgetRequest(data) {
  const payload = { ...data }
  if ('total' in payload) payload.total = Number(payload.total)
  if (payload.categories && typeof payload.categories === 'object') {
    payload.categories = Object.entries(payload.categories).reduce((acc, [categoryId, amount]) => {
      acc[categoryId] = Number(amount)
      return acc
    }, {})
  }
  return payload
}

function mapBudgetResponse(item) {
  if (!item) return item
  const b = { ...item }
  if ('total' in b) b.total = Number(b.total)
  if ('total_amount' in b) b.total = Number(b.total_amount)
  if (Array.isArray(b.items)) {
    b.categories = b.items.reduce((acc, it) => {
      if (it && it.category_id != null) acc[it.category_id] = Number(it.amount || 0)
      return acc
    }, {})
  }
  return b
}

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
    }).then(res => {
      const data = res.data || res
      return mapBudgetResponse(data)
    })
  },

  /**
   * 设置/更新预算
   * @param {Object} data 预算信息
   */
  saveBudget(data) {
    const payload = mapBudgetRequest(data)
    return request({
      url: '/budgets',
      method: 'post',
      data: payload
    })
  }
}
