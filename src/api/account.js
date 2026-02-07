import request from '@/utils/request'

export default {
  /**
   * 获取账户列表
   */
  getAccounts() {
    return request({
      url: '/accounts',
      method: 'get'
    })
  },

  /**
   * 创建账户
   * @param {Object} data 账户信息
   */
  createAccount(data) {
    return request({
      url: '/accounts',
      method: 'post',
      data
    })
  },

  /**
   * 更新账户
   * @param {Number} id 账户ID
   * @param {Object} data 更新信息
   */
  updateAccount(id, data) {
    return request({
      url: `/accounts/${id}`,
      method: 'put',
      data
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
