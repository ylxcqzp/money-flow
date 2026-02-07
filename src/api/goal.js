import request from '@/utils/request'

export default {
  /**
   * 获取目标列表
   */
  getGoals() {
    return request({
      url: '/goals',
      method: 'get'
    })
  },

  /**
   * 创建目标
   * @param {Object} data
   */
  createGoal(data) {
    return request({
      url: '/goals',
      method: 'post',
      data
    })
  },

  /**
   * 更新目标
   * @param {Number} id
   * @param {Object} data
   */
  updateGoal(id, data) {
    return request({
      url: `/goals/${id}`,
      method: 'put',
      data
    })
  },

  /**
   * 删除目标
   * @param {Number} id
   */
  deleteGoal(id) {
    return request({
      url: `/goals/${id}`,
      method: 'delete'
    })
  },

  /**
   * 存取款记录
   * @param {Number} goalId
   * @param {Object} data { amount, operateDate }
   */
  addGoalRecord(goalId, data) {
    const payload = { ...data }
    return request({
      url: `/goals/${goalId}/records`,
      method: 'post',
      data: payload
    })
  }
}
