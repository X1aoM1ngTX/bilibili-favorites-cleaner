# 宝塔面板Nginx配置解决方案

## 问题分析

您遇到的404错误是因为前端请求 `http://8.134.200.55:11451/api/config`，但前端服务器（11451端口）没有API接口，API接口在后端服务器（8123端口）上。

## 解决方案

### 方案一：使用Nginx反向代理（推荐）

1. **在宝塔面板中配置Nginx反向代理**

   登录宝塔面板 → 网站 → 设置 → 反向代理 → 添加反向代理

   ```
   代理名称: bilibili-api
   目标URL: http://127.0.0.1:8123
   发送域名: $host
   内容替换: 无
   ```

2. **或者直接编辑Nginx配置文件**

   在宝塔面板 → 网站 → 设置 → 配置文件中添加以下配置：

   ```nginx
   # API反向代理配置
   location /api {
       proxy_pass http://127.0.0.1:8123;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   
   # 健康检查代理
   location /health {
       proxy_pass http://127.0.0.1:8123/health;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

3. **重新构建前端**

   ```bash
   cd /www/wwwroot/你的项目目录/frontend
   npm run build
   ```

### 方案二：修改前端配置直接访问后端

如果不使用反向代理，可以直接修改前端配置：

1. **修改前端环境变量**

   编辑 `/www/wwwroot/你的项目目录/frontend/.env.production`：

   ```env
   VUE_APP_API_BASE_URL=http://8.134.200.55:8123/api
   ```

2. **重新构建前端**

   ```bash
   cd /www/wwwroot/你的项目目录/frontend
   npm run build
   ```

3. **配置后端CORS**

   确保后端允许来自前端的跨域请求，在 `rebuild/backend/server.js` 中：

   ```javascript
   app.use(cors({
       origin: ['http://8.134.200.55:11451', 'http://8.134.200.55'],
       credentials: true
   }));
   ```

## 完整的宝塔面板部署步骤

### 1. 部署后端服务

1. 在宝塔面板 → PM2管理器 → 添加项目
2. 项目设置：
   - 项目名称: bilibili-cleaner-backend
   - 启动文件: `/www/wwwroot/你的项目目录/backend/server.js`
   - 项目目录: `/www/wwwroot/你的项目目录/backend`
   - 环境变量:
     ```
     PORT=8123
     HOST=0.0.0.0
     NODE_ENV=production
     FRONTEND_URL=http://8.134.200.55:11451
     LOG_LEVEL=info
     ```

### 2. 部署前端服务

1. 在宝塔面板 → 网站 → 添加站点
2. 站点设置：
   - 域名: `8.134.200.55:11451`
   - 根目录: `/www/wwwroot/你的项目目录/frontend/dist`
   - PHP版本: 纯静态

### 3. 配置反向代理

1. 在网站设置中添加反向代理配置（如方案一所示）
2. 或者直接编辑nginx配置文件

### 4. 防火墙设置

确保在宝塔面板 → 安全 中开放以下端口：
- 11451 (前端)
- 8123 (后端)

## 验证部署

1. **检查后端服务**
   ```
   curl http://8.134.200.55:8123/health
   ```

2. **检查前端服务**
   ```
   curl http://8.134.200.55:11451
   ```

3. **检查API代理**
   ```
   curl http://8.134.200.55:11451/api/config
   ```

## 常见问题

### 问题1: 502 Bad Gateway
**原因**: 后端服务未启动或端口不正确
**解决**: 检查PM2中的后端服务状态，确保端口8123可访问

### 问题2: CORS错误
**原因**: 跨域配置不正确
**解决**: 使用方案一的nginx反向代理，或正确配置后端CORS

### 问题3: 静态文件404
**原因**: 前端构建文件路径不正确
**解决**: 确保前端已正确构建，且nginx根目录指向dist文件夹

## 推荐配置

推荐使用**方案一（Nginx反向代理）**，因为：
1. 避免了跨域问题
2. 前后端使用同一个端口，更简洁
3. 更好的安全性，后端不直接暴露
4. 便于负载均衡和缓存配置