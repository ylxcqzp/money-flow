import request from '@/utils/request'

export default {
  /**
   * 登录
   * @param {Object} data { email, password }
   */
  login(data) {
    return request({
      url: '/auth/login',
      method: 'post',
      data
    })
  },

  /**
   * 发送验证码
   * @param {Object} data { email }
   */
  sendVerifyCode(data) {
    return request({
      url: '/auth/send-code',
      method: 'post',
      data
    })
  },

  /**
   * 注册
   * @param {Object} data { username, email, password, code }
   */
  register(data) {
    return request({
      url: '/auth/register',
      method: 'post',
      data
    })
  },

  /**
   * 刷新令牌
   * @param {Object} data { refreshToken }
   */
  refreshToken(data) {
    return request({
      url: '/auth/refresh',
      method: 'post',
      data
    })
  },

  /**
   * 获取当前用户信息
   */
  getUserInfo() {
    return request({
      url: '/auth/me',
      method: 'get'
    })
  },

  /**
   * 退出登录
   */
  logout() {
    return request({
      url: '/auth/logout',
      method: 'post'
    })
  }
}
