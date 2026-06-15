# 微信小程序预览指南

## 前置条件

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册微信小程序账号（可选，游客模式也可预览）

## 预览步骤

### 1. 打开项目

1. 打开微信开发者工具
2. 选择「小程序」项目
3. 点击「导入项目」
4. 项目目录选择：`/Users/wukexin/Downloads/recipes-collection-app/miniprogram`
5. AppID 选择「测试号」或使用已有 AppID
6. 点击「导入」

### 2. 预览模式

导入项目后，可以使用以下方式预览：

#### 模拟器预览
- 在开发者工具中直接查看模拟器效果
- 支持切换不同手机型号
- 支持切换横竖屏

#### 真机预览
1. 点击工具栏的「预览」按钮
2. 扫描生成的二维码
3. 在手机上查看效果

#### 自动预览
1. 修改代码后自动刷新
2. 支持热重载

### 3. 调试功能

- **Console**: 查看日志输出
- **Network**: 查看网络请求
- **AppData**: 查看页面数据
- **Wxml**: 查看页面结构
- **Sources**: 查看源代码

### 4. 预览配置

已配置的预览页面：
- 首页 (`pages/index/index`)
- 食谱列表 (`pages/recipes/recipes`)
- 食谱详情 (`pages/recipe/recipe?id=1`)
- 添加食谱 (`pages/add-recipe/add-recipe`)
- 本周计划 (`pages/this-week/this-week`)
- 设置 (`pages/settings/settings`)
- 家庭 (`pages/family/family`)
- 登录 (`pages/login/login`)

## 注意事项

1. **API 配置**: 修改 `app.js` 中的 `baseUrl` 为你的服务器地址
2. **域名白名单**: 在微信公众平台配置服务器域名
3. **AppID**: 使用测试号或正式 AppID
4. **HTTPS**: 所有请求必须使用 HTTPS

## 快速测试

1. 打开开发者工具
2. 在模拟器中点击各个页面
3. 测试语言切换功能
4. 测试食谱添加功能
5. 测试图片上传功能
6. 测试分享功能

## 常见问题

**Q: 无法预览？**
A: 检查 AppID 是否正确，或使用测试号

**Q: API 请求失败？**
A: 检查域名配置和 HTTPS 设置

**Q: 页面空白？**
A: 检查控制台错误信息，查看代码是否有语法错误
