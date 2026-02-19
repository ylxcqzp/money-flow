# Money Flow API 文档

本文档描述了 Money Flow 前端项目所需的后端接口规范。
所有接口均基于 RESTful 风格。
基础 URL: `/api` (可配置)

## 通用说明

### 鉴权
所有受保护的接口需要在 Request Header 中携带 Access Token：
`Authorization: Bearer <accessToken>`

### 统一响应结构
后端统一返回结构为：
- `code`: 业务状态码，0 表示成功
- `message`: 提示信息
- `data`: 业务数据

响应示例：
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 业务错误码说明

| 错误码 | 含义 | 说明 |
| :--- | :--- | :--- |
| 0 | 成功 | 请求处理成功 |
| 400 | 参数错误 | 请求参数不合法，如邮箱格式错误、验证码长度不符等 |
| 401 | 未认证 | 令牌无效、已过期或验证码错误、刷新令牌已失效 |
| 403 | 无权限 | 尝试访问不属于自己的资源 |
| 409 | 业务冲突 | 资源已存在，如邮箱已被注册 |
| 429 | 请求过多 | 触发频率限制，如发送验证码过于频繁 |
| 500 | 系统错误 | 后端内部处理异常或三方服务（邮件/Redis）不可用 |

---

## 0. 部署与环境配置 (Deployment)

### 依赖环境
- **Java**: JDK 17+
- **Database**: MySQL 8.0+
- **Cache**: Redis 6.0+
- **Mail**: 支持 SMTP 协议的邮箱服务（如 QQ邮箱、Gmail、阿里云邮件推送等）

### 关键配置项 (application.yml)

#### Redis 配置 (最新配置方式)
```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:127.0.0.1}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      database: 0
```
- 用于存储：邮箱验证码（防刷）、Refresh Token、登录限流信息。

#### 邮件服务配置 (SMTP)
```yaml
spring:
  mail:
    host: ${MAIL_HOST:smtp.example.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:} # 授权码而非登录密码
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```
- **注意**: 发送验证码前必须确保 SMTP 服务已开启，且配置了正确的 `MAIL_FROM` 地址。

---

## 1. 认证 (Auth)

### 1.1 发送邮箱验证码
- **URL**: `/api/auth/send-code`
- **Method**: `POST`
- **描述**: 发送注册验证码
- **Request Body 参数**:
  - `email` (string, 必填): 用户邮箱
- **Request Body 示例**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response data 字段**: 无
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": null
  }
  ```

### 1.2 用户登录
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **描述**: 邮箱密码登录
- **Request Body 参数**:
  - `email` (string, 必填): 用户邮箱
  - `password` (string, 必填): 登录密码，长度 8-64
- **Request Body 示例**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response data 字段**:
  - `accessToken` (string): 访问令牌
  - `refreshToken` (string): 刷新令牌
  - `user` (object): 用户信息
  - `user.id` (number): 用户ID
  - `user.username` (string): 用户名
  - `user.nickname` (string): 昵称
  - `user.email` (string): 邮箱
  - `user.avatarUrl` (string): 头像地址
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "accessToken": "jwt-token-string",
      "refreshToken": "refresh-token-string",
      "user": {
        "id": 1,
        "username": "User",
        "nickname": "User",
        "email": "user@example.com",
        "avatarUrl": "https://example.com/avatar.png"
      }
    }
  }
  ```

### 1.3 用户注册
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **描述**: 邮箱验证码注册
- **Request Body 参数**:
  - `username` (string, 必填): 用户名，长度 2-30
  - `email` (string, 必填): 邮箱
  - `password` (string, 必填): 登录密码，长度 8-64
  - `code` (string, 必填): 邮箱验证码，长度 4-6
- **Request Body 示例**:
  ```json
  {
    "username": "Nickname",
    "email": "user@example.com",
    "password": "password123",
    "code": "123456"
  }
  ```
- **Response data 字段**: 同登录接口
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "accessToken": "jwt-token-string",
      "refreshToken": "refresh-token-string",
      "user": {
        "id": 2,
        "username": "Nickname",
        "nickname": "Nickname",
        "email": "user@example.com",
        "avatarUrl": "https://example.com/avatar.png"
      }
    }
  }
  ```

### 1.4 刷新令牌
- **URL**: `/api/auth/refresh`
- **Method**: `POST`
- **描述**: 刷新访问令牌
- **Request Body 参数**:
  - `refreshToken` (string, 必填): 刷新令牌
- **Request Body 示例**:
  ```json
  {
    "refreshToken": "refresh-token-string"
  }
  ```
- **Response data 字段**: 同登录接口
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "accessToken": "jwt-token-string",
      "refreshToken": "refresh-token-string",
      "user": {
        "id": 1,
        "username": "User",
        "nickname": "User",
        "email": "user@example.com",
        "avatarUrl": "https://example.com/avatar.png"
      }
    }
  }
  ```

### 1.5 获取当前用户信息
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **描述**: 获取当前登录用户信息
- **Query Params**: 无
- **Response data 字段**:
  - `user` (object): 用户信息
  - `user.id` (number): 用户ID
  - `user.username` (string): 用户名
  - `user.nickname` (string): 昵称
  - `user.email` (string): 邮箱
  - `user.avatarUrl` (string): 头像地址
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "user": {
        "id": 1,
        "username": "User",
        "nickname": "User",
        "email": "user@example.com",
        "avatarUrl": "https://example.com/avatar.png"
      }
    }
  }
  ```

### 1.6 退出登录
- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **描述**: 退出登录
- **Request Body**: 无
- **Response data 字段**: 无
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": null
  }
  ```

---

## 2. 账户 (Account)

### 2.1 获取账户列表
- **URL**: `/api/accounts`
- **Method**: `GET`
- **描述**: 获取当前用户的资产账户列表
- **Query Params**: 无
- **Response data 字段**:
  - `id` (number): 账户ID
  - `name` (string): 账户名称
  - `type` (string): 账户类型
  - `icon` (string): 账户图标
  - `initialBalance` (number): 初始余额
  - `currentBalance` (number): 当前余额
  - `sortOrder` (number): 排序值
- **前端查询示例**: `/api/accounts`
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": [
      {
        "id": 1,
        "name": "现金",
        "type": "cash",
        "icon": "Wallet",
        "initialBalance": 1000.00,
        "currentBalance": 1500.00,
        "sortOrder": 0
      }
    ]
  }
  ```

### 2.2 创建账户
- **URL**: `/api/accounts`
- **Method**: `POST`
- **描述**: 创建资产账户
- **Request Body 参数**:
  - `name` (string, 必填): 账户名称
  - `type` (string, 必填): 账户类型
  - `icon` (string, 可选): 账户图标
  - `initialBalance` (number, 必填): 初始余额
  - `sortOrder` (number, 可选): 排序值
- **Request Body 示例**:
  ```json
  {
    "name": "招商银行",
    "type": "card",
    "icon": "CreditCard",
    "initialBalance": 5000.00,
    "sortOrder": 1
  }
  ```
- **Response data 字段**: 同账户列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 3,
      "name": "招商银行",
      "type": "card",
      "icon": "CreditCard",
      "initialBalance": 5000.00,
      "currentBalance": 5000.00,
      "sortOrder": 1
    }
  }
  ```

### 2.3 更新账户
- **URL**: `/api/accounts/{id}`
- **Method**: `PUT`
- **描述**: 更新账户信息
- **Path Params**:
  - `id` (number, 必填): 账户ID
- **Request Body 参数**:
  - `name` (string, 可选): 账户名称
  - `type` (string, 可选): 账户类型
  - `icon` (string, 可选): 账户图标
  - `initialBalance` (number, 可选): 初始余额
  - `sortOrder` (number, 可选): 排序值
- **Request Body 示例**:
  ```json
  {
    "name": "工资卡",
    "icon": "BankCard",
    "sortOrder": 2
  }
  ```
- **Response data 字段**: 同账户列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 3,
      "name": "工资卡",
      "type": "card",
      "icon": "BankCard",
      "initialBalance": 5000.00,
      "currentBalance": 5200.00,
      "sortOrder": 2
    }
  }
  ```

### 2.4 删除账户
- **URL**: `/api/accounts/{id}`
- **Method**: `DELETE`
- **描述**: 删除账户
- **Path Params**:
  - `id` (number, 必填): 账户ID
- **Response data 字段**: 无
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": null
  }
  ```

---

## 3. 分类 (Category)

### 3.1 获取分类列表
- **URL**: `/api/categories`
- **Method**: `GET`
- **描述**: 获取分类列表
- **Query Params**:
  - `type` (string, 可选): 分类类型
- **前端查询示例**: `/api/categories?type=expense`
- **Response data 字段**:
  - `id` (number): 分类ID
  - `name` (string): 分类名称
  - `type` (string): 分类类型
  - `icon` (string): 分类图标
  - `parentId` (number): 父级分类ID
  - `sortOrder` (number): 排序值
  - `children` (array): 子分类列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": [
      {
        "id": 1,
        "name": "餐饮",
        "type": "expense",
        "icon": "Utensils",
        "parentId": 0,
        "sortOrder": 0,
        "children": [
          {
            "id": 11,
            "name": "夜宵",
            "type": "expense",
            "icon": "Food",
            "parentId": 1,
            "sortOrder": 0,
            "children": []
          }
        ]
      }
    ]
  }
  ```

### 3.2 创建分类
- **URL**: `/api/categories`
- **Method**: `POST`
- **描述**: 创建分类
- **Request Body 参数**:
  - `name` (string, 必填): 分类名称
  - `type` (string, 必填): 分类类型
  - `icon` (string, 可选): 分类图标
  - `parentId` (number, 可选): 父级分类ID
  - `sortOrder` (number, 可选): 排序值
- **Request Body 示例**:
  ```json
  {
    "name": "夜宵",
    "type": "expense",
    "icon": "Food",
    "parentId": 1,
    "sortOrder": 0
  }
  ```
- **Response data 字段**: 同分类列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 11,
      "name": "夜宵",
      "type": "expense",
      "icon": "Food",
      "parentId": 1,
      "sortOrder": 0,
      "children": []
    }
  }
  ```

### 3.3 更新分类
- **URL**: `/api/categories/{id}`
- **Method**: `PUT`
- **描述**: 更新分类
- **Path Params**:
  - `id` (number, 必填): 分类ID
- **Request Body 参数**:
  - `name` (string, 可选): 分类名称
  - `type` (string, 可选): 分类类型
  - `icon` (string, 可选): 分类图标
  - `parentId` (number, 可选): 父级分类ID
  - `sortOrder` (number, 可选): 排序值
- **Request Body 示例**:
  ```json
  {
    "name": "早餐"
  }
  ```
- **Response data 字段**: 同分类列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 11,
      "name": "早餐",
      "type": "expense",
      "icon": "Food",
      "parentId": 1,
      "sortOrder": 0,
      "children": []
    }
  }
  ```

### 3.4 删除分类
- **URL**: `/api/categories/{id}`
- **Method**: `DELETE`
- **描述**: 删除分类
- **Path Params**:
  - `id` (number, 必填): 分类ID
- **Response data 字段**: 无
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": null
  }
  ```

---

## 4. 交易 (Transaction)

### 4.1 获取交易列表
- **URL**: `/api/transactions`
- **Method**: `GET`
- **描述**: 获取交易列表
- **Query Params**:
  - `startDate` (string, 可选): 开始日期，格式 yyyy-MM-dd
  - `endDate` (string, 可选): 结束日期，格式 yyyy-MM-dd
  - `type` (string, 可选): 交易类型
  - `categoryId` (number, 可选): 分类ID
  - `accountId` (number, 可选): 账户ID
  - `tags` (string, 可选): 标签列表，逗号分隔
- **前端查询示例**: `/api/transactions?startDate=2026-02-01&endDate=2026-02-29&type=expense&accountId=1&tags=工作餐,外卖`
- **Response data 字段**:
  - `id` (number): 交易ID
  - `type` (string): 交易类型
  - `amount` (number): 金额
  - `date` (string): 发生日期
  - `categoryId` (number): 分类ID
  - `accountId` (number): 主账户ID
  - `targetAccountId` (number): 目标账户ID
  - `note` (string): 备注
  - `tags` (array): 标签列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": [
      {
        "id": 1001,
        "type": "expense",
        "amount": 50.00,
        "date": "2026-02-04",
        "categoryId": 10,
        "accountId": 1,
        "targetAccountId": null,
        "note": "午餐",
        "tags": [
          "工作餐",
          "外卖"
        ]
      }
    ]
  }
  ```

### 4.2 分页获取交易列表
- **URL**: `/api/transactions/page`
- **Method**: `GET`
- **描述**: 分页获取交易列表
- **Query Params**:
  - `page` (number, 可选): 页码，从 1 开始，默认 1
  - `size` (number, 可选): 每页大小，默认 20
  - `startDate` (string, 可选): 开始日期，格式 yyyy-MM-dd
  - `endDate` (string, 可选): 结束日期，格式 yyyy-MM-dd
  - `type` (string, 可选): 交易类型
  - `categoryId` (number, 可选): 分类ID
  - `accountId` (number, 可选): 账户ID
  - `tags` (string, 可选): 标签列表，逗号分隔
- **前端查询示例**: `/api/transactions/page?page=1&size=20&startDate=2026-02-01&endDate=2026-02-29&type=expense`
- **Response data 字段**:
  - `records` (array): 交易列表
  - `total` (number): 总记录数
  - `size` (number): 每页大小
  - `current` (number): 当前页码
  - `pages` (number): 总页数
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "records": [
        {
          "id": 1001,
          "type": "expense",
          "amount": 50.00,
          "date": "2026-02-04",
          "categoryId": 10,
          "accountId": 1,
          "targetAccountId": null,
          "note": "午餐",
          "tags": [
            "工作餐",
            "外卖"
          ]
        }
      ],
      "total": 120,
      "size": 20,
      "current": 1,
      "pages": 6
    }
  }
  ```

### 4.3 创建交易
- **URL**: `/api/transactions`
- **Method**: `POST`
- **描述**: 创建交易
- **Request Body 参数**:
  - `type` (string, 必填): 交易类型
  - `amount` (number, 必填): 金额，大于 0
  - `currency` (string, 可选): 原币种
  - `originalAmount` (number, 可选): 原币种金额
  - `date` (string, 必填): 发生日期，格式 yyyy-MM-dd
  - `categoryId` (number, 可选): 分类ID
  - `accountId` (number, 必填): 主账户ID
  - `targetAccountId` (number, 可选): 目标账户ID
  - `note` (string, 可选): 备注
  - `tags` (array, 可选): 标签列表
- **Request Body 示例**:
  ```json
  {
    "type": "expense",
    "amount": 50.00,
    "currency": "CNY",
    "originalAmount": 50.00,
    "date": "2026-02-04",
    "categoryId": 10,
    "accountId": 1,
    "note": "备注",
    "tags": [
      "tag1",
      "tag2"
    ]
  }
  ```
- **Response data 字段**: 同交易列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 1002,
      "type": "expense",
      "amount": 50.00,
      "date": "2026-02-04",
      "categoryId": 10,
      "accountId": 1,
      "targetAccountId": null,
      "note": "备注",
      "tags": [
        "tag1",
        "tag2"
      ]
    }
  }
  ```

### 4.4 更新交易
- **URL**: `/api/transactions/{id}`
- **Method**: `PUT`
- **描述**: 更新交易
- **Path Params**:
  - `id` (number, 必填): 交易ID
- **Request Body 参数**:
  - `type` (string, 可选): 交易类型
  - `amount` (number, 可选): 金额
  - `date` (string, 可选): 发生日期，格式 yyyy-MM-dd
  - `categoryId` (number, 可选): 分类ID
  - `accountId` (number, 可选): 主账户ID
  - `targetAccountId` (number, 可选): 目标账户ID
  - `note` (string, 可选): 备注
  - `tags` (array, 可选): 标签列表
- **Request Body 示例**:
  ```json
  {
    "amount": 60.00,
    "note": "修改后的备注"
  }
  ```
- **Response data 字段**: 同交易列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 1002,
      "type": "expense",
      "amount": 60.00,
      "date": "2026-02-04",
      "categoryId": 10,
      "accountId": 1,
      "targetAccountId": null,
      "note": "修改后的备注",
      "tags": [
        "tag1",
        "tag2"
      ]
    }
  }
  ```

### 4.5 删除交易
- **URL**: `/api/transactions/{id}`
- **Method**: `DELETE`
- **描述**: 删除交易
- **Path Params**:
  - `id` (number, 必填): 交易ID
- **Response data 字段**: 无
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": null
  }
  ```

---

## 5. 预算 (Budget)

### 5.1 获取月度预算
- **URL**: `/api/budgets`
- **Method**: `GET`
- **描述**: 获取指定月份预算
- **Query Params**:
  - `month` (string, 必填): 月份，格式 yyyy-MM
- **前端查询示例**: `/api/budgets?month=2026-02`
- **Response data 字段**:
  - `month` (string): 月份
  - `total` (number): 总预算
  - `categories` (object): 分类预算映射
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "month": "2026-02",
      "total": 5000.00,
      "categories": {
        "10": 1000.00,
        "20": 500.00
      }
    }
  }
  ```

### 5.2 设置/更新预算
- **URL**: `/api/budgets`
- **Method**: `POST`
- **描述**: 设置或更新预算
- **Request Body 参数**:
  - `month` (string, 必填): 月份，格式 yyyy-MM
  - `total` (number, 必填): 总预算
  - `categories` (object, 可选): 分类预算映射
- **Request Body 示例**:
  ```json
  {
    "month": "2026-02",
    "total": 5000.00,
    "categories": {
      "10": 1000.00
    }
  }
  ```
- **Response data 字段**: 同获取月度预算
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "month": "2026-02",
      "total": 5000.00,
      "categories": {
        "10": 1000.00
      }
    }
  }
  ```

---

## 6. 周期性规则 (Recurring Rule)

### 6.1 获取规则列表
- **URL**: `/api/recurring-rules`
- **Method**: `GET`
- **描述**: 获取周期性规则列表
- **Query Params**: 无
- **前端查询示例**: `/api/recurring-rules`
- **Response data 字段**:
  - `id` (number): 规则ID
  - `type` (string): 类型
  - `amount` (number): 金额
  - `categoryId` (number): 分类ID
  - `accountId` (number): 账户ID
  - `frequency` (string): 频率
  - `description` (string): 描述
  - `startDate` (string): 开始日期
  - `nextExecutionDate` (string): 下次执行日期
  - `status` (number): 状态
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": [
      {
        "id": 1,
        "type": "expense",
        "amount": 3000.00,
        "categoryId": 20,
        "accountId": 1,
        "frequency": "monthly",
        "description": "房租",
        "startDate": "2026-03-01",
        "nextExecutionDate": "2026-04-01",
        "status": 0
      }
    ]
  }
  ```

### 6.2 创建规则
- **URL**: `/api/recurring-rules`
- **Method**: `POST`
- **描述**: 创建周期性规则
- **Request Body 参数**:
  - `type` (string, 必填): 类型
  - `amount` (number, 必填): 金额，大于 0
  - `frequency` (string, 必填): 频率
  - `startDate` (string, 必填): 开始日期，格式 yyyy-MM-dd
  - `categoryId` (number, 必填): 分类ID
  - `accountId` (number, 必填): 账户ID
  - `description` (string, 可选): 描述
  - `status` (number, 可选): 状态
- **Request Body 示例**:
  ```json
  {
    "type": "expense",
    "amount": 3000,
    "frequency": "monthly",
    "startDate": "2026-03-01",
    "categoryId": 20,
    "accountId": 1,
    "description": "房租",
    "status": 0
  }
  ```
- **Response data 字段**: 同规则列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 1,
      "type": "expense",
      "amount": 3000.00,
      "categoryId": 20,
      "accountId": 1,
      "frequency": "monthly",
      "description": "房租",
      "startDate": "2026-03-01",
      "nextExecutionDate": "2026-04-01",
      "status": 0
    }
  }
  ```

### 6.3 更新规则
- **URL**: `/api/recurring-rules/{id}`
- **Method**: `PUT`
- **描述**: 更新周期性规则
- **Path Params**:
  - `id` (number, 必填): 规则ID
- **Request Body 参数**:
  - `type` (string, 可选): 类型
  - `amount` (number, 可选): 金额
  - `frequency` (string, 可选): 频率
  - `startDate` (string, 可选): 开始日期，格式 yyyy-MM-dd
  - `categoryId` (number, 可选): 分类ID
  - `accountId` (number, 可选): 账户ID
  - `description` (string, 可选): 描述
  - `status` (number, 可选): 状态
- **Request Body 示例**:
  ```json
  {
    "amount": 3200.00,
    "description": "房租调整"
  }
  ```
- **Response data 字段**: 同规则列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 1,
      "type": "expense",
      "amount": 3200.00,
      "categoryId": 20,
      "accountId": 1,
      "frequency": "monthly",
      "description": "房租调整",
      "startDate": "2026-03-01",
      "nextExecutionDate": "2026-04-01",
      "status": 0
    }
  }
  ```

### 6.4 删除规则
- **URL**: `/api/recurring-rules/{id}`
- **Method**: `DELETE`
- **描述**: 删除周期性规则
- **Path Params**:
  - `id` (number, 必填): 规则ID
- **Response data 字段**: 无
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": null
  }
  ```

---

## 7. 储蓄目标 (Goal)

### 7.1 获取目标列表
- **URL**: `/api/goals`
- **Method**: `GET`
- **描述**: 获取储蓄目标列表
- **Query Params**: 无
- **前端查询示例**: `/api/goals`
- **Response data 字段**:
  - `id` (number): 目标ID
  - `name` (string): 目标名称
  - `targetAmount` (number): 目标金额
  - `currentAmount` (number): 当前金额
  - `deadline` (string): 截止日期
  - `icon` (string): 图标
  - `color` (string): 颜色
  - `status` (string): 状态（ongoing/completed/archived）
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": [
      {
        "id": 1,
        "name": "旅行基金",
        "targetAmount": 8000.00,
        "currentAmount": 2000.00,
        "deadline": "2026-12-31",
        "icon": "Plane",
        "color": "#FFAA00",
        "status": "ongoing"
      }
    ]
  }
  ```

### 7.2 创建目标
- **URL**: `/api/goals`
- **Method**: `POST`
- **描述**: 创建储蓄目标
- **Request Body 参数**:
  - `name` (string, 必填): 目标名称
  - `targetAmount` (number, 必填): 目标金额，大于 0
  - `deadline` (string, 可选): 截止日期，格式 yyyy-MM-dd
  - `icon` (string, 可选): 图标
  - `color` (string, 可选): 颜色
- **Request Body 示例**:
  ```json
  {
    "name": "旅行基金",
    "targetAmount": 8000.00,
    "deadline": "2026-12-31",
    "icon": "Plane",
    "color": "#FFAA00"
  }
  ```
- **Response data 字段**: 同目标列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 1,
      "name": "旅行基金",
      "targetAmount": 8000.00,
      "currentAmount": 0.00,
      "deadline": "2026-12-31",
      "icon": "Plane",
      "color": "#FFAA00",
      "status": "active"
    }
  }
  ```

### 7.3 更新目标
- **URL**: `/api/goals/{id}`
- **Method**: `PUT`
- **描述**: 更新储蓄目标
- **Path Params**:
  - `id` (number, 必填): 目标ID
- **Request Body 参数**:
  - `name` (string, 可选): 目标名称
  - `targetAmount` (number, 可选): 目标金额
  - `deadline` (string, 可选): 截止日期，格式 yyyy-MM-dd
  - `icon` (string, 可选): 图标
  - `color` (string, 可选): 颜色
  - `status` (string, 可选): 状态（ongoing/completed/archived）
- **Request Body 示例**:
  ```json
  {
    "targetAmount": 9000.00,
    "status": "ongoing"
  }
  ```
- **Response data 字段**: 同目标列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 1,
      "name": "旅行基金",
      "targetAmount": 9000.00,
      "currentAmount": 2000.00,
      "deadline": "2026-12-31",
      "icon": "Plane",
      "color": "#FFAA00",
      "status": "active"
    }
  }
  ```

### 7.4 删除目标
- **URL**: `/api/goals/{id}`
- **Method**: `DELETE`
- **描述**: 删除储蓄目标
- **Path Params**:
  - `id` (number, 必填): 目标ID
- **Response data 字段**: 无
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": null
  }
  ```

### 7.5 新增目标存取记录
- **URL**: `/api/goals/{id}/records`
- **Method**: `POST`
- **描述**: 新增目标存取记录
- **Path Params**:
  - `id` (number, 必填): 目标ID
- **Request Body 参数**:
  - `amount` (number, 必填): 操作金额
  - `operateDate` (string, 可选): 操作日期，格式 yyyy-MM-dd
- **Request Body 示例**:
  ```json
  {
    "amount": 1000.00,
    "operateDate": "2026-02-04"
  }
  ```
- **Response data 字段**: 同目标列表
- **Response 示例**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": 1,
      "name": "旅行基金",
      "targetAmount": 8000.00,
      "currentAmount": 3000.00,
      "deadline": "2026-12-31",
      "icon": "Plane",
      "color": "#FFAA00",
      "status": "active"
    }
  }
  ```
