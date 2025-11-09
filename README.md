# 哔哩哔哩收藏夹清理工具

一个基于Vue.js和Node.js的哔哩哔哩收藏夹工具，可以帮助您批量清理收藏夹中的失效视频。

## 功能特点

- 🔄 自动检测并清理收藏夹中的失效视频
- 📱 支持二维码扫码登录
- 🍪 Cookie管理功能
- 🎯 批量操作，支持全选/取消全选
- 📊 实时显示清理进度
- 🎨 现代化的用户界面（基于Ant Design Vue）
- 🔄 收藏夹移动功能（支持跨收藏夹移动视频）
- 📋 收藏夹排序功能（拖拽调整收藏夹顺序）

## 技术栈

- **前端**: Vue 3 + Pinia + Vue Router + Ant Design Vue
- **后端**: Node.js + Express
- **样式**: CSS3 + 响应式设计
- **HTTP客户端**: Axios
- **架构**: 前后端分离

## 快速开始

### 环境要求

- Node.js 14.0 或更高版本
- npm 6.0 或更高版本

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动服务器

#### Windows用户

双击运行 `start.bat` 或在命令行中执行：

```bash
start.bat
```

#### Linux/Mac用户

```bash
chmod +x start.sh
./start.sh
```

#### 手动启动

如果自动启动脚本不工作，可以手动启动：

1. 启动后端服务器：
```bash
cd backend
npm start
```

2. 启动前端服务器（新开一个终端）：
```bash
cd frontend
npm run serve
```

### 访问应用

- 前端地址: http://localhost:3000
- 后端API: http://localhost:8080
- 健康检查: http://localhost:8080/health

## 使用说明

### 1. 登录配置

1. 打开应用后，默认显示"登录配置"选项卡
2. 页面会自动显示登录二维码
3. 使用哔哩哔哩APP扫描二维码登录
4. 登录成功后，Cookie会自动保存

### 2. 清理收藏夹

1. 登录成功后，切换到"清理收藏夹"选项卡
2. 应用会自动加载您的收藏夹列表
3. 选择要清理的收藏夹（可以多选）
4. 点击"清理选中的收藏夹"开始清理
5. 等待清理完成，查看结果

### 3. 移动视频

1. 登录成功后，切换到"移动视频"选项卡
2. 选择源收藏夹（要移出视频的收藏夹）
3. 选择目标收藏夹（要移入视频的收藏夹）
4. 系统会自动检测可移动的视频
5. 选择要移动的视频，点击"移动选中的视频"

### 4. 收藏夹排序（新功能）

1. 登录成功后，切换到"收藏夹排序"选项卡
2. 系统会加载您的收藏夹列表
3. 按住左侧菜单图标拖拽收藏夹来调整顺序
4. 默认收藏夹无法移动，会始终保持在第一位
5. 调整完成后，点击"保存排序"

### 5. 手动配置Cookie

如果二维码登录不工作，您也可以手动配置Cookie：

1. 在登录配置页面，点击"手动配置Cookie"
2. 粘贴完整的Cookie字符串
3. 点击"保存Cookie"

## 项目结构

```
bilibili-favorites-cleaner/
├── backend/                 # 后端代码
│   ├── routes/             # API路由
│   │   ├── config.js       # 配置管理
│   │   ├── favorites.js    # 收藏夹管理
│   │   ├── clean.js        # 清理功能
│   │   ├── convert.js      # Cookie转换
│   │   ├── move.js         # 移动功能
│   │   └── sort.js         # 排序功能
│   ├── utils/              # 工具函数
│   └── server.js           # 服务器入口
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # Vue组件
│   │   │   ├── LoginPanel.vue    # 登录面板
│   │   │   ├── CleanPanel.vue    # 清理面板
│   │   │   ├── MovePanel.vue     # 移动面板
│   │   │   └── SortPanel.vue     # 排序面板
│   │   ├── layouts/        # 布局组件
│   │   ├── pages/          # 页面组件
│   │   ├── stores/         # Pinia状态管理
│   │   ├── utils/          # 工具函数
│   │   └── router/         # 路由配置
│   └── package.json
├── start.sh                # Linux/Mac启动脚本
├── start.bat               # Windows启动脚本
└── README.md               # 说明文档
```

## API接口

### 配置管理

- `GET /api/config` - 获取配置
- `POST /api/config` - 保存配置
- `DELETE /api/config` - 删除配置

### 收藏夹管理

- `GET /api/favorites` - 获取收藏夹列表
- `GET /api/favorites/:id` - 获取收藏夹详情

### 清理操作

- `POST /api/clean` - 清理单个收藏夹
- `POST /api/clean/batch` - 批量清理收藏夹

### 移动操作

- `GET /api/move/favorites` - 获取收藏夹列表
- `GET /api/move/videos/:sourceId/:targetId` - 获取可移动的视频
- `POST /api/move/videos` - 移动视频到目标收藏夹

### 排序操作

- `GET /api/sort/folders` - 获取收藏夹列表
- `POST /api/sort/execute` - 执行收藏夹排序

## 开发说明

### 前端开发

前端使用Vue 3 + Composition API开发，状态管理使用Pinia，UI组件库使用Ant Design Vue。

### 后端开发

后端使用Express框架，提供RESTful API接口。

### 开发环境端口配置

- 前端开发服务器：3000端口
- 后端API服务器：8080端口
- 前端通过代理访问后端API，避免跨域问题

### 调试技巧

1. 打开浏览器开发者工具查看控制台日志
2. 检查网络请求是否正常
3. 查看后端服务器日志

## 常见问题

### Q: 二维码不显示怎么办？

A: 请检查：
1. 后端服务器是否正常启动
2. 网络连接是否正常
3. 浏览器控制台是否有错误信息

### Q: 收藏夹列表加载失败怎么办？

A: 请检查：
1. 是否已成功登录
2. Cookie是否有效
3. 后端API是否正常响应

### Q: 清理失败怎么办？

A: 请检查：
1. 收藏夹是否有权限访问
2. 网络连接是否稳定
3. 查看错误信息提示

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。
