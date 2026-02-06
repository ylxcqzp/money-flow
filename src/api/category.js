import request from '@/utils/request'

function mapCategoryRequest(data) {
  const payload = { ...data }
  if ('sortOrder' in payload) payload.sortOrder = Number(payload.sortOrder)
  return payload
}

function mapCategoryResponse(item) {
  if (!item) return item
  const c = { ...item }
  if ('parent_id' in c) c.parentId = c.parent_id
  if ('sort_order' in c) c.sortOrder = c.sort_order
  if (Array.isArray(c.children)) c.children = c.children.map(mapCategoryResponse)
  return c
}

export default {
  /**
   * 获取分类列表
   * @param {Object} params { type: 'expense' | 'income' }
   */
  getCategories(params) {
    const mappedParams = { ...(params || {}) }
    return request({
      url: '/categories',
      method: 'get',
      params: mappedParams
    }).then(res => {
      const data = res.data || res
      return Array.isArray(data) ? data.map(mapCategoryResponse) : mapCategoryResponse(data)
    })
  },

  /**
   * 创建分类
   * @param {Object} data 分类信息
   */
  createCategory(data) {
    const payload = mapCategoryRequest(data)
    return request({
      url: '/categories',
      method: 'post',
      data: payload
    })
  },

  /**
   * 更新分类
   * @param {Number} id 分类ID
   * @param {Object} data 更新信息
   */
  updateCategory(id, data) {
    const payload = mapCategoryRequest(data)
    return request({
      url: `/categories/${id}`,
      method: 'put',
      data: payload
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
