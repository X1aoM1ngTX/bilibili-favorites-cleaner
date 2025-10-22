# 宝塔面板Ubuntu服务器部署指南

## 环境变量配置

### 1. 后端环境变量配置

在宝塔面板中为后端服务配置环境变量有几种方式：

#### 方式一：通过宝塔面板的PM2管理器配置

1. 在宝塔面板中安装PM2管理器
2. 创建PM2项目时，在"环境变量"部分添加以下配置：

```bash
PORT=8123
HOST=0.0.0.0
FRONTEND_URL=http://你的域名或IP:11451
LOG_LEVEL=info
NODE_ENV=production
```

#### 方式二：通过.env文件配置

1. 在项目根目录创建`.env`文件：

```bash
# 进入项目目录
cd /www/wwwroot/你的项目目录/backend

# 创建.env文件
nano .env
```

2. 添加以下内容：

```env
# 服务器配置
PORT=8123
HOST=0.0.0.0

# 前端URL（用于CORS配置）
FRONTEND_URL=http://你的域名或IP:11451

# 日志级别
LOG_LEVEL=info

# 生产环境
NODE_ENV=production
```

#### 方式三：通过系统环境变量配置

1. 编辑系统环境变量文件：

```bash
nano /etc/profile
```

2. 在文件末尾添加：

```bash
export PORT=8123
export HOST=0.0.0.0
export FRONTEND_URL=http://你的域名或IP:11451
export LOG_LEVEL=info
export NODE_ENV=production
```

3. 使配置生效：

```bash
source /etc/profile
```

### 2. 前端环境变量配置

前端在构建时需要设置生产环境变量：

1. 创建生产环境配置文件：

```bash
cd /www/wwwroot/你的项目目录/frontend
nano .env.production
```

2. 添加以下内容：

```env
# 生产环境API地址
VUE_APP_API_BASE_URL=http://你的域名或IP:8123/api

# 应用标题
VUE_APP_TITLE=哔哩哔哩收藏夹清理工具
```

### 3. 宝塔面板网站配置

#### 配置后端（Node.js）：

1. 在宝塔面板创建新站点，选择"Node.js项目"
2. 配置启动文件为：`/www/wwwroot/你的项目目录/backend/server.js`
3. 设置环境变量：
   - `PORT=8123`
   - `HOST=0.0.0.0`
   - `NODE_ENV=production`

#### 配置前端（静态网站）：

1. 在宝塔面板创建新站点，选择"静态网站"
2. 网站目录指向：`/www/wwwroot/你的项目目录/frontend/dist`
3. 配置反向代理（如果需要）：

```nginx
location /api {
    proxy_pass http://127.0.0.1:8123;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 4. 完整部署步骤

#### 步骤1：准备服务器环境

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

# 安装PM2
npm install pm2 -g
```

#### 步骤2：上传并构建项目

```bash
# 上传项目到服务器
cd /www/wwwroot/你的项目目录

# 安装后端依赖
cd backend
npm install

# 安装前端依赖并构建
cd ../frontend
npm install
npm run build
```

#### 步骤3：配置并启动服务

```bash
# 启动后端服务
cd /www/wwwroot/你的项目目录/backend
pm2 start server.js --name "bilibili-cleaner-backend"

# 设置PM2开机自启
pm2 startup
pm2 save
```

### 5. 常见问题解决

#### 问题1：前端无法访问后端API

**解决方案：**
1. 检查后端服务是否正常运行：`pm2 list`
2. 检查防火墙是否开放端口：`ufw status`
3. 确认环境变量中的FRONTEND_URL和VUE_APP_API_BASE_URL配置正确

#### 问题2：CORS跨域问题

**解决方案：**
在server.js中配置正确的CORS策略，或使用nginx反向代理

#### 问题3：环境变量不生效

**解决方案：**
1. 重启PM2服务：`pm2 restart bilibili-cleaner-backend`
2. 检查环境变量是否正确设置：`pm2 env 0`

### 6. 监控和日志

#### 查看PM2日志：

```bash
# 查看所有日志
pm2 logs

# 查看特定应用日志
pm2 logs bilibili-cleaner-backend
```

#### 监控服务状态：

```bash
# 查看服务状态
pm2 status

# 查看详细信息
pm2 show bilibili-cleaner-backend
```

### 7. 安全配置建议

1. **使用HTTPS**：在宝塔面板中为域名配置SSL证书
2. **防火墙设置**：只开放必要的端口（80, 443, 22）
3. **定期备份**：设置宝塔面板的定时备份任务
4. **更新维护**：定期更新Node.js和npm包

## 总结

在宝塔面板的Ubuntu服务器上部署您的B站收藏夹清理工具，主要需要：

1. 配置后端环境变量（PORT, HOST, NODE_ENV等）
2. 配置前端生产环境变量（VUE_APP_API_BASE_URL等）
3. 使用PM2管理Node.js进程
4. 配置nginx反向代理（可选）
5. 设置防火墙和SSL证书保证安全

按照以上步骤操作，您应该能够成功在宝塔面板上部署您的应用。