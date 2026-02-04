import request from '@/utils/request'

export default {
  /**
   * 获取分类列表
   * @param {Object} params { type: 'expense' | 'income' }
   */
  getCategories(params) {
    return request({
      url: '/categories',
      method: 'get',
      params
    })
  },

  /**
   * 创建分类
   * @param {Object} data 分类信息
   */
  createCategory(data) {
    return request({
      url: '/categories',
      method: 'post',
      data
    })
  },

  /**
   * 更新分类
   * @param {Number} id 分类ID
   * @param {Object} data 更新信息
   */
  updateCategory(id, data) {
    return request({
      url: `/categories/${id}`,
      method: 'put',
      data
    })
  },

  /**
   * 删除分类
   * @param {Number} id 分类ID
   */
  deleteCategory(id) {
    return request({
      url: `/categories/${id}`,
      method: 'delete'
    })
  }
}
