import request from '@/utils/request'

function mapAccountRequest(data) {
  const payload = { ...data }
  if ('initialBalance' in payload) payload.initialBalance = Number(payload.initialBalance)
  if ('sortOrder' in payload) payload.sortOrder = Number(payload.sortOrder)
  return payload
}

function mapAccountResponse(item) {
  if (!item) return item
  const a = { ...item }
  if ('initial_balance' in a) a.initialBalance = Number(a.initial_balance)
  if ('current_balance' in a) a.currentBalance = Number(a.current_balance)
  if ('sort_order' in a) a.sortOrder = a.sort_order
  return a
}

export default {
  /**
   * 获取账户列表
   */
  getAccounts() {
    return request({
      url: '/accounts',
      method: 'get'
    }).then(res => {
      const data = res.data || res
      return Array.isArray(data) ? data.map(mapAccountResponse) : data
    })
  },

  /**
   * 创建账户
   * @param {Object} data 账户信息
   */
  createAccount(data) {
    const payload = mapAccountRequest(data)
    return request({
      url: '/accounts',
      method: 'post',
      data: payload
    })
  },

  /**
   * 更新账户
   * @param {Number} id 账户ID
   * @param {Object} data 更新信息
   */
  updateAccount(id, data) {
    const payload = mapAccountRequest(data)
    return request({
      url: `/accounts/${id}`,
      method: 'put',
      data: payload
    })
  },

  /**
   * 删除账户
   * @param {Number} id 账户ID
   */
  deleteAccount(id) {
    return request({
      url: `/accounts/${id}`,
      method: 'delete'
    })
  }
}
