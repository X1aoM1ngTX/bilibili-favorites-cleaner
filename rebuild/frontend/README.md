# 哔哩哔哩收藏夹清理工具 - 前端应用

这是哔哩哔哩收藏夹清理工具的前端应用，基于Vue 3构建，提供现代化的用户界面和交互体验。

## 功能特点

- 🎯 **现代化界面**: 基于Vue 3 + Composition API构建
- 🎨 **响应式设计**: 支持桌面和移动设备
- 🔥 **状态管理**: 使用Pinia进行状态管理
- 🌐 **HTTP请求**: 基于Axios的API请求封装
- 📱 **组件化架构**: 模块化的组件设计
- 🔄 **实时更新**: 实时显示操作进度和状态
- 🎭 **Toast提示**: 友好的消息提示系统

## 技术栈

- **框架**: Vue 3
- **构建工具**: Vue CLI
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **工具库**: @vueuse/core
- **样式**: CSS3 + Flexbox/Grid

## 项目结构

```
frontend/
├── public/              # 静态资源
│   └── index.html       # HTML模板
├── src/                 # 源代码
│   ├── assets/          # 资源文件
│   │   └── styles/      # 样式文件
│   ├── components/      # 组件
│   │   ├── Header.vue   # 头部组件
│   │   ├── Toast.vue    # 消息提示组件
│   │   ├── ConfigStatus.vue # 配置状态组件
│   │   ├── LoginPanel.vue   # 登录面板组件
│   │   └── CleanPanel.vue   # 清理面板组件
│   ├── router/          # 路由配置
│   │   └── index.js
│   ├── stores/          # 状态管理
│   │   ├── config.js    # 配置状态
│   │   ├── favorites.js # 收藏夹状态
│   │   └── toast.js     # 消息状态
│   ├── utils/           # 工具函数
│   │   └── api.js       # API封装
│   ├── views/           # 页面组件
│   │   └── Home.vue     # 主页面
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── .env.development     # 开发环境配置
├── .env.production      # 生产环境配置
├── package.json         # 项目配置
├── vue.config.js        # Vue配置
└── README.md            # 说明文档
```

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式
```bash
npm run serve
```

应用将在 `http://localhost:8080` 启动。

### 3. 生产构建
```bash
npm run build
```

构建文件将输出到 `dist/` 目录。

### 4. 代码检查
```bash
npm run lint
```

## 组件说明

### Header组件
- 显示应用标题和副标题
- 响应式设计，适配移动设备

### ConfigStatus组件
- 显示当前配置状态
- 实时更新配置信息
- 显示用户ID（已配置时）

### LoginPanel组件
- 嵌入式iframe登录
- Cookie展示和复制功能
- 手动配置Cookie选项
- 登录状态实时反馈

### CleanPanel组件
- 收藏夹列表展示
- 批量选择和清理功能
- 实时进度显示
- 清理结果统计

### Toast组件
- 全局消息提示
- 支持多种类型（成功、错误、警告、信息）
- 自动消失机制

## 状态管理

### ConfigStore
- 管理用户配置信息
- 提供配置的增删改查功能
- 实时状态检查

### FavoritesStore
- 管理收藏夹列表
- 处理收藏夹选择状态
- 提供清理功能接口

### ToastStore
- 管理全局消息提示
- 统一的消息接口
- 自动生命周期管理

## API封装

基于Axios封装的HTTP客户端，提供：
- 统一的错误处理
- 请求/响应拦截器
- 自动超时处理
- 开发环境代理支持

## 环境配置

### 开发环境
- API地址: `http://localhost:3000/api`
- 开发服务器端口: 8080
- 支持热重载

### 生产环境
- API地址: `/api`（相对路径）
- 静态资源优化
- 代码压缩和混淆

## 开发说明

### 代码规范
- 使用ESLint进行代码检查
- 遵循Vue 3 Composition API最佳实践
- 组件命名采用PascalCase
- 文件命名采用kebab-case

### 样式规范
- 使用CSS3现代特性
- 响应式设计优先
- 组件样式scoped
- 统一的设计变量

### 性能优化
- 组件懒加载
- 图片优化
- 代码分割
- 缓存策略

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

MIT License