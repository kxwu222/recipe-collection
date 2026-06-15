# 微信小程序后端适配指南

## 概述

本指南说明如何将现有的 Express + tRPC 后端适配为微信小程序可用的 API 服务。

## 主要变更

### 1. 认证系统

**现有方案**: OAuth + Session Cookies
**小程序方案**: 微信登录 (wx.login + code2session)

#### 新增接口

```javascript
// POST /api/auth/wechat-login
// 请求体: { code: string }
// 响应: { token: string, user: object }
app.post('/api/auth/wechat-login', async (req, res) => {
  const { code } = req.body
  
  // 1. 调用微信 code2session 接口
  const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    params: {
      appid: process.env.WECHAT_APPID,
      secret: process.env.WECHAT_SECRET,
      js_code: code,
      grant_type: 'authorization_code'
    }
  })
  
  const { openid, session_key } = wxResponse.data
  
  // 2. 查找或创建用户
  let user = await getUserByOpenId(openid)
  if (!user) {
    user = await createUser({ openId: openid })
  }
  
  // 3. 生成 JWT token
  const token = jwt.sign({ userId: user.id, openId: openid }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  })
  
  res.json({ token, user })
})
```

### 2. API 路由适配

**现有方案**: tRPC (类型安全 RPC)
**小程序方案**: 普通 REST API

需要将 tRPC 路由转换为 REST 端点：

| tRPC 路由 | REST 端点 | 方法 |
|-----------|----------|------|
| `household.list` | `/api/household/list` | GET |
| `household.create` | `/api/household/create` | POST |
| `household.join` | `/api/household/join` | POST |
| `household.members` | `/api/household/members` | GET |
| `recipe.list` | `/api/recipe/list` | GET |
| `recipe.get` | `/api/recipe/get` | GET |
| `recipe.create` | `/api/recipe/create` | POST |
| `recipe.update` | `/api/recipe/update` | PUT |
| `recipe.delete` | `/api/recipe/delete` | DELETE |
| `recipe.extract` | `/api/recipe/extract` | POST |
| `recipe.search` | `/api/recipe/search` | GET |
| `weeklyPlan.list` | `/api/weekly-plan/list` | GET |
| `weeklyPlan.add` | `/api/weekly-plan/add` | POST |
| `weeklyPlan.remove` | `/api/weekly-plan/remove` | DELETE |
| `weeklyPlan.checkIngredient` | `/api/weekly-plan/check-ingredient` | POST |
| `weeklyPlan.getChecklist` | `/api/weekly-plan/checklist` | GET |
| `toBuyList.list` | `/api/to-buy-list/list` | GET |
| `toBuyList.add` | `/api/to-buy-list/add` | POST |
| `toBuyList.check` | `/api/to-buy-list/check` | POST |
| `toBuyList.delete` | `/api/to-buy-list/delete` | DELETE |

### 3. 中间件适配

```javascript
// 认证中间件
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' })
  }
  
  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await getUserById(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: '用户不存在' })
    }
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效' })
  }
}

// 应用到需要认证的路由
app.use('/api/household', authMiddleware)
app.use('/api/recipe', authMiddleware)
app.use('/api/weekly-plan', authMiddleware)
app.use('/api/to-buy-list', authMiddleware)
```

### 4. 环境变量

```env
# 微信小程序配置
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret

# JWT 配置
JWT_SECRET=your_jwt_secret

# 数据库配置
DATABASE_URL=mysql://user:password@host:port/database

# LLM 配置（用于食谱提取）
LLM_API_KEY=your_llm_api_key
LLM_API_URL=your_llm_api_url
```

### 5. 小程序配置

在微信公众平台配置：

1. **服务器域名**
   - request 合法域名: `https://your-api-domain.com`
   - uploadFile 合法域名: `https://your-api-domain.com`
   - downloadFile 合法域名: `https://your-api-domain.com`

2. **业务域名**
   - 如需 web-view 组件，添加业务域名

## 部署步骤

1. 修改 `miniprogram/app.js` 中的 `baseUrl` 为你的服务器地址
2. 修改 `miniprogram/utils/api.js` 中的 API 端点
3. 在微信公众平台配置服务器域名
4. 使用微信开发者工具上传小程序代码
5. 提交审核

## 注意事项

1. **HTTPS 必须**: 微信小程序要求所有请求必须使用 HTTPS
2. **域名白名单**: 必须在微信公众平台配置合法域名
3. **代码包大小**: 小程序代码包限制 2MB
4. **接口超时**: 默认 60 秒，可在 app.json 中配置
5. **数据缓存**: 使用 wx.setStorageSync/wx.getStorageSync 进行本地缓存
