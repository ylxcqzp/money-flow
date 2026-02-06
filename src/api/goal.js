import request from '@/utils/request'

function mapGoalRequest(data) {
  const payload = { ...data }
  if ('targetAmount' in payload) payload.targetAmount = Number(payload.targetAmount)
  if ('currentAmount' in payload) payload.currentAmount = Number(payload.currentAmount)
  return payload
}

function mapGoalResponse(item) {
  if (!item) return item
  const g = { ...item }
  if ('target_amount' in g) g.targetAmount = Number(g.target_amount)
  if ('current_amount' in g) g.currentAmount = Number(g.current_amount)
  return g
}

export default {
  /**
   * 获取目标列表
   */
  getGoals() {
    return request({
      url: '/goals',
      method: 'get'
    }).then(res => {
      const data = res.data || res
      return Array.isArray(data) ? data.map(mapGoalResponse) : data
    })
  },

  /**
   * 创建目标
   * @param {Object} data
   */
  createGoal(data) {
    const payload = mapGoalRequest(data)
    return request({
      url: '/goals',
      method: 'post',
      data: payload
    })
  },

  /**
   * 更新目标
   * @param {Number} id
   * @param {Object} data
   */
  updateGoal(id, data) {
    const payload = mapGoalRequest(data)
    return request({
      url: `/goals/${id}`,
      method: 'put',
      data: payload
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
