# 502 Bad Gateway 错误故障排除指南

## 问题分析

502 Bad Gateway错误表示nginx无法连接到后端服务。根据您的配置，nginx尝试将 `/api` 请求代理到 `http://127.0.0.1:8123`，但连接失败。

## 排查步骤

### 1. 检查后端服务是否运行

在服务器上执行以下命令：

```bash
# 检查8123端口是否有进程监听
netstat -tlnp | grep 8123

# 或者使用ss命令
ss -tlnp | grep 8123

# 检查Node.js进程
ps aux | grep node
```

如果没有输出，说明后端服务没有运行。

### 2. 检查PM2进程状态

```bash
# 查看PM2进程列表
pm2 list

# 查看特定进程的详细信息
pm2 show bilibili-cleaner-backend

# 查看进程日志
pm2 logs bilibili-cleaner-backend
```

### 3. 手动测试后端服务

```bash
# 直接测试后端API
curl http://127.0.0.1:8123/health

# 或者使用wget
wget http://127.0.0.1:8123/health
```

### 4. 检查防火墙设置

```bash
# 检查iptables规则
iptables -L -n

# 检查ufw状态（如果使用ufw）
ufw status

# 检查firewalld状态（如果使用firewalld）
firewall-cmd --list-all
```

### 5. 检查nginx错误日志

```bash
# 查看nginx错误日志
tail -f /www/wwwlogs/8.134.200.55_11451.error.log

# 或者查看系统nginx日志
tail -f /var/log/nginx/error.log
```

## 常见解决方案

### 方案1：启动后端服务

如果后端服务没有运行，使用PM2启动：

```bash
cd /www/wwwroot/你的项目目录/backend
pm2 start server.js --name bilibili-cleaner-backend
```

### 方案2：检查后端配置

确保后端服务监听正确的地址和端口：

1. 检查 `.env.production` 文件：
   ```env
   PORT=8123
   HOST=0.0.0.0
   NODE_ENV=production
   ```

2. 检查 `server.js` 中的监听配置：
   ```javascript
   app.listen(PORT, HOST, () => {
     console.log(`服务器运行在 http://${HOST}:${PORT}`);
   });
   ```

### 方案3：重启PM2服务

```bash
# 重启后端服务
pm2 restart bilibili-cleaner-backend

# 重新加载PM2配置
pm2 reload all
```

### 方案4：检查端口占用

如果8123端口被其他服务占用：

```bash
# 查找占用8123端口的进程
lsof -i :8123

# 杀死占用进程（如果需要）
kill -9 <PID>
```

### 方案5：修改nginx配置

如果后端服务运行在不同地址，修改nginx配置：

```nginx
location /api {
    proxy_pass http://后端实际IP:8123;
    # ... 其他配置
}
```

## 完整的启动流程

### 1. 启动后端服务

```bash
# 进入后端目录
cd /www/wwwroot/你的项目目录/backend

# 检查环境变量
cat .env.production

# 启动服务
pm2 start server.js --name bilibili-cleaner-backend --env production

# 设置开机自启
pm2 startup
pm2 save
```

### 2. 测试后端服务

```bash
# 测试健康检查
curl http://127.0.0.1:8123/health

# 预期响应
{"status":"ok","timestamp":"2023-..."}
```

### 3. 重新加载nginx配置

```bash
# 测试nginx配置
nginx -t

# 重新加载配置
nginx -s reload
```

### 4. 测试完整链路

```bash
# 测试nginx代理
curl http://8.134.200.55:11451/health

# 测试API接口
curl http://8.134.200.55:11451/api/config
```

## 调试技巧

### 1. 启用详细日志

在nginx配置中添加：
```nginx
location /api {
    access_log /var/log/nginx/api_access.log;
    error_log /var/log/nginx/api_error.log debug;
    # ... 其他配置
}
```

### 2. 使用curl调试

```bash
# 详细模式测试
curl -v http://8.134.200.55:11451/api/config

# 显示响应头
curl -I http://8.134.200.55:11451/api/config
```

### 3. 检查网络连接

```bash
# 测试端口连通性
telnet 127.0.0.1 8123

# 或者使用nc
nc -zv 127.0.0.1 8123
```

## 常见错误信息及解决

### "connect() failed (111: Connection refused)"

**原因**: 后端服务没有运行或端口不对
**解决**: 启动后端服务，检查端口配置

### "connect() failed (113: No route to host)"

**原因**: 网络路由问题
**解决**: 检查防火墙和网络配置

### "upstream timed out"

**原因**: 后端响应超时
**解决**: 增加超时时间或优化后端性能

## 紧急恢复方案

如果无法快速解决，可以临时修改前端配置直接访问后端：

1. 修改 `frontend/.env.production`:
   ```env
   VUE_APP_API_BASE_URL=http://8.134.200.55:8123/api
   ```

2. 重新构建前端：
   ```bash
   npm run build
   ```

这样可以绕过nginx直接访问后端，但可能会有跨域问题。