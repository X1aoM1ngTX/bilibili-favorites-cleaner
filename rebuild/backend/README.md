# 哔哩哔哩收藏夹清理工具 - 后端API服务

这是哔哩哔哩收藏夹清理工具的后端API服务，提供RESTful接口用于管理收藏夹和清理失效内容。

## 功能特点

- 🚀 **RESTful API**: 提供标准化的REST接口
- 🔒 **安全防护**: 集成Helmet安全中间件
- 🌐 **CORS支持**: 支持跨域请求
- 📊 **日志记录**: 集成Morgan日志中间件
- ⚙️ **配置管理**: 支持环境变量配置
- 🛡️ **错误处理**: 统一的错误处理机制

## API接口

### 配置管理
- `GET /api/config` - 获取配置
- `POST /api/config` - 保存配置
- `DELETE /api/config` - 删除配置

### 收藏夹管理
- `GET /api/favorites` - 获取收藏夹列表
- `GET /api/favorites/:id` - 获取收藏夹详情

### 清理功能
- `POST /api/clean` - 清理单个收藏夹
- `POST /api/clean/batch` - 批量清理收藏夹

### 工具接口
- `POST /api/convert-cookies` - 转换Cookie格式

### 系统接口
- `GET /health` - 健康检查

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，修改相关配置
```

### 3. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动。

## 项目结构

```
backend/
├── routes/          # 路由文件
│   ├── config.js    # 配置管理路由
│   ├── favorites.js # 收藏夹管理路由
│   ├── clean.js     # 清理功能路由
│   └── convert.js   # Cookie转换路由
├── utils/           # 工具函数
│   └── config.js    # 配置工具函数
├── data/            # 数据存储目录
├── public/          # 静态文件目录
├── .env.example     # 环境变量示例
├── package.json     # 项目配置
├── server.js        # 服务器入口文件
└── README.md        # 说明文档
```

## 开发说明

### 环境要求
- Node.js 14.0 或更高版本
- npm 6.0 或更高版本

### 开发工具
- `nodemon`: 开发时自动重启服务
- `dotenv`: 环境变量管理
- `morgan`: HTTP请求日志
- `helmet`: 安全头设置
- `cors`: 跨域资源共享

### 错误处理
所有API接口都遵循统一的错误处理格式：

```json
{
  "success": false,
  "error": "错误信息"
}
```

成功响应格式：

```json
{
  "success": true,
  "data": {}
}
```

## 安全考虑

- 所有API接口都配置了CORS策略
- 使用Helmet设置安全HTTP头
- 配置文件存储在服务器本地，不暴露给客户端
- 敏感信息通过环境变量配置

## 许可证

MIT License