# 架构图文档（money-flow-backend）

## 项目信息
- 项目名称：money-flow-backend（Spring Boot 3.5.10）
- JDK：17
- 数据库：MySQL 8.0+
- 持久层：MyBatis-Plus
- 认证方式：JWT
- 统一响应与异常处理：Result + 全局异常处理
- 缓存：Redis（验证码、限流、令牌）
- 邮件服务：SMTP（Spring Mail）

## 分层架构概览
- Controller：承接 HTTP 请求、参数校验、输出统一 Result
- Service：业务逻辑聚合
- Mapper：MyBatis-Plus 数据访问
- Entity/DTO/VO：实体、入参、出参模型

## 系统架构图（逻辑视图）
```mermaid
flowchart TB
  subgraph Web层
    C1[AuthController]
    C2[业务Controller集合]
  end

  subgraph Service层
    S1[AuthServiceImpl]
    S2[业务ServiceImpl集合]
  end

  subgraph 持久层
    M1[Mapper接口集合]
    DB[(MySQL)]
  end

  subgraph 通用组件
    R1[Result统一响应]
    E1[GlobalExceptionHandler]
    MP[MyBatis-Plus]
    META[MyMetaObjectHandler]
    MS[MailService]
    RL[RateLimiter]
    TS[TokenStore]
  end

  C1 --> S1 --> M1 --> DB
  C2 --> S2 --> M1 --> DB
  S1 --> R1
  S2 --> R1
  C1 --> E1
  C2 --> E1
  M1 --> MP
  MP --> META
MS --> R1
RL --> R1
TS --> R1
```

## 核心流程：请求处理链路
```mermaid
sequenceDiagram
  participant Client
  participant Controller
  participant Service
  participant Mapper
  participant DB

  Client->>Controller: HTTP请求（JSON）
  Controller->>Service: 参数校验+业务调用
  Service->>Mapper: 数据操作
  Mapper->>DB: SQL执行
  DB-->>Mapper: 数据结果
  Mapper-->>Service: 结果映射
  Service-->>Controller: VO封装
  Controller-->>Client: Result<T>
```

## 认证与授权架构流程图（JWT）

### 1）登录流程
```mermaid
sequenceDiagram
  participant Client
  participant AuthController
  participant AuthServiceImpl
  participant AuthManager
  participant SysUserMapper
  participant JwtService

  Client->>AuthController: POST /api/auth/login
  AuthController->>AuthServiceImpl: login(request)
  AuthServiceImpl->>AuthManager: authenticate(email+password)
  AuthManager-->>AuthServiceImpl: 认证成功/失败
  AuthServiceImpl->>SysUserMapper: 查询用户实体
  SysUserMapper-->>AuthServiceImpl: SysUser
  AuthServiceImpl->>JwtService: generateToken(user)
  JwtService-->>AuthServiceImpl: JWT Token
  AuthServiceImpl-->>AuthController: AuthLoginResponse
  AuthController-->>Client: Result<AuthLoginResponse>
```

### 2）带Token访问流程
```mermaid
sequenceDiagram
  participant Client
  participant JwtFilter as JwtAuthenticationFilter
  participant JwtService
  participant UserDetailsService as SysUserDetailsService
  participant SecurityContext
  participant Controller

  Client->>JwtFilter: 请求携带Authorization Token
  JwtFilter->>JwtService: 解析Token（subject）
  JwtService-->>JwtFilter: email/claims
  JwtFilter->>UserDetailsService: loadUserByUsername(email)
  UserDetailsService-->>JwtFilter: SysUserDetails
  JwtFilter->>SecurityContext: 写入认证信息
  JwtFilter->>Controller: 放行请求
  Controller-->>Client: Result<T>
```

### 3）未认证/无权限处理
```mermaid
flowchart LR
  Req[请求] --> Sec[SecurityFilterChain]
  Sec -->|未登录| Entry[AuthAuthenticationEntryPoint]
  Sec -->|无权限| Denied[AuthAccessDeniedHandler]
  Entry --> Resp[Result.UNAUTHORIZED]
  Denied --> Resp2[Result.FORBIDDEN/INVALID]
```

### 4）发送邮箱验证码流程
```mermaid
sequenceDiagram
  participant Client
  participant AuthController
  participant AuthServiceImpl
  participant SysUserMapper
  participant RateLimiter as RL
  participant Cache as Redis
  participant MailService as MS

  Client->>AuthController: POST /api/auth/send-code {email}
  AuthController->>AuthServiceImpl: sendCode(email, ip)
  AuthServiceImpl->>SysUserMapper: 查询邮箱是否已注册
  SysUserMapper-->>AuthServiceImpl: 存在/不存在
  AuthServiceImpl->>RL: 校验IP/邮箱限流
  RL-->>AuthServiceImpl: 通过/拒绝
  AuthServiceImpl->>Redis: 生成并写入验证码（TTL 5-10min）
  Redis-->>AuthServiceImpl: OK
  AuthServiceImpl->>MS: 发送邮件（验证码）
  MS-->>AuthServiceImpl: OK
  AuthServiceImpl-->>AuthController: Result<Void>
  AuthController-->>Client: 发送成功/错误码提示
```

### 5）注册（邮箱+验证码）流程
```mermaid
sequenceDiagram
  participant Client
  participant AuthController
  participant AuthServiceImpl
  participant Cache as Redis
  participant PasswordEncoder as BCrypt
  participant SysUserMapper

  Client->>AuthController: POST /api/auth/register {email,password,code}
  AuthController->>AuthServiceImpl: register(request)
  AuthServiceImpl->>Redis: 读取验证码并比对
  Redis-->>AuthServiceImpl: 一致/不一致或过期
  AuthServiceImpl->>BCrypt: 加密密码
  BCrypt-->>AuthServiceImpl: 密文
  AuthServiceImpl->>SysUserMapper: 写入用户（邮箱+密文）
  SysUserMapper-->>AuthServiceImpl: OK
  AuthServiceImpl->>Redis: 删除验证码缓存
  Redis-->>AuthServiceImpl: OK
  AuthServiceImpl-->>AuthController: Result<AuthUserVO>
  AuthController-->>Client: 注册成功
```

### 6）刷新令牌流程
```mermaid
sequenceDiagram
  participant Client
  participant AuthController
  participant AuthServiceImpl
  participant JwtService
  participant TokenStore as Redis/DB

  Client->>AuthController: POST /api/auth/refresh {refreshToken}
  AuthController->>AuthServiceImpl: refresh(refreshToken)
  AuthServiceImpl->>TokenStore: 校验refreshToken有效性与绑定关系
  TokenStore-->>AuthServiceImpl: 有效/无效
  AuthServiceImpl->>JwtService: 生成新的accessToken（并可轮换refreshToken）
  JwtService-->>AuthServiceImpl: 新令牌对
  AuthServiceImpl->>TokenStore: 更新/写入refreshToken状态
  TokenStore-->>AuthServiceImpl: OK
  AuthServiceImpl-->>AuthController: Result<AuthLoginResponse>
  AuthController-->>Client: 刷新成功/错误码提示
```

## 数据层与自动填充机制
- 逻辑删除：全局逻辑删除字段为 delFlag，删除值 1，未删除值 0
- 自动填充：创建/更新时自动填充 createBy/createTime/updateBy/updateTime
- 分页与拦截器：MyBatis-Plus 分页插件

## 定时任务流程
```mermaid
sequenceDiagram
  participant Scheduler
  participant RecurringRuleTask
  participant BusRecurringRuleService
  participant DB

  Scheduler->>RecurringRuleTask: 每日 01:00 触发
  RecurringRuleTask->>BusRecurringRuleService: generateAllTransactions()
  BusRecurringRuleService->>DB: 读写周期性规则与交易
  DB-->>BusRecurringRuleService: 结果
  BusRecurringRuleService-->>RecurringRuleTask: 生成交易列表
  RecurringRuleTask-->>Scheduler: 记录日志
```

## 模块与接口域概览（按Controller分组）
- 认证管理：/api/auth/*
  - POST /api/auth/send-code（发送邮箱验证码）
  - POST /api/auth/register（邮箱验证码注册）
  - POST /api/auth/login（邮箱+密码登录）
  - POST /api/auth/refresh（刷新令牌）
- 账户管理：/api/accounts
- 交易管理：/api/transactions
- 分类管理：/api/categories
- 预算管理：/api/budgets、/api/budget-items
- 目标管理：/api/goals、/api/goal-records
- 标签管理：/api/tags、/api/transaction-tags
- 系统模块：用户、设备、登录日志
