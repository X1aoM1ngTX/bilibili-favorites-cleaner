# B站收藏夹清理工具

一个用于快速清理B站收藏夹失效视频的Web工具，提供直观的界面操作和精确的统计功能。

## 功能特点

- 🎯 **精准清理**：自动识别并删除失效视频（已删除、私享、仅会员可见等）
- 📊 **详细统计**：显示清理前后的收藏夹状态和精确的数量变化
- 🌐 **Web界面**：提供直观简单的Web界面操作
- 📱 **嵌入式登录**：支持iframe模式的扫码登录（基于 [WittF/bilibili-qr-login](https://github.com/WittF/bilibili-qr-login) 项目，感谢原作者 [@WittF](https://github.com/WittF) 的贡献！）
- 🍪 **Cookie管理**：自动获取和展示登录Cookie
- 📋 **一键复制**：支持Cookie内容一键复制功能
- 🔄 **实时更新**：实时显示收藏夹列表和清理进度

## 安装和使用

### 1. 克隆项目
```bash
git clone https://github.com/X1aoM1ngTX/BilibiliFavCleaner.git
cd BilibiliFavCleaner
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动Web服务器
```bash
npm start
```

### 4. 打开浏览器访问
```
http://localhost:8080
```

### 5. 使用步骤
1. 页面加载后会自动显示嵌入式登录界面
2. 使用B站APP扫描二维码完成登录
3. 登录成功后页面会自动显示Cookie内容
4. 点击"获取收藏夹列表"按钮加载收藏夹
5. 选择要清理的收藏夹
6. 点击"开始清理"按钮执行清理
7. 查看清理结果和详细的统计信息

## 功能说明

### 嵌入式登录
- 页面加载时自动显示iframe登录界面
- 支持B站APP扫码登录
- 登录成功后自动获取Cookie并展示
- 支持Cookie内容一键复制

> 本项目的登录功能基于 [WittF/bilibili-qr-login](https://github.com/WittF/bilibili-qr-login) 项目，感谢原作者 [@WittF](https://github.com/WittF) 提供的优秀解决方案。

### 收藏夹管理
- 自动获取用户的所有收藏夹列表
- 显示每个收藏夹的名称和当前视频数量
- 支持选择特定收藏夹进行清理

### 清理功能
- 自动识别失效视频（已删除、私享、仅会员可见等）
- 精确统计清理前后的视频数量变化
- 提供详细的清理日志和结果展示

## 技术实现

- **前端**：HTML5 + CSS3 + JavaScript（原生）
- **后端**：Node.js + Express
- **登录方式**：嵌入式iframe登录（基于 [bilibili-qr-login](https://github.com/WittF/bilibili-qr-login)）
- **API接口**：B站收藏夹API
- **数据格式**：JSON

## 项目结构
```
CleanUpBilibiliFavorites/
├── index.html              # Web界面主页面
├── app.js                  # 前端应用逻辑
├── web-server.js           # Web服务器
├── styles.css              # 样式文件
├── config.json             # 配置文件
├── package.json            # 项目配置
└── README.md               # 说明文档
```

## 注意事项

- ⚠️ **重要提醒**：清理操作不可逆，请谨慎操作
- 🔒 **隐私安全**：Cookie信息包含敏感数据，请妥善保管
- 📋 **备份建议**：清理前建议备份重要的收藏夹数据
- 🌐 **网络要求**：需要稳定的网络连接
- 🔢 **频率限制**：避免频繁操作，可能触发B站的访问限制

## 故障排除

### 常见问题

1. **登录失败**
   - 检查网络连接是否正常
   - 确认iframe登录界面是否正常加载
   - 尝试刷新页面重新登录

2. **获取收藏夹列表失败**
   - 检查Cookie信息是否正确
   - 确认网络连接正常
   - 检查是否已正确登录B站

3. **清理失败**
   - 确认收藏夹是否存在
   - 检查网络连接是否稳定
   - 查看错误信息进行排查

4. **页面加载问题**
   - 确认服务器是否正常启动
   - 检查端口3000是否被占用
   - 尝试重启服务器

## 开发说明

### 环境要求
- Node.js 12.0 或更高版本

### 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 自定义配置
可以通过修改`config.json`文件来自定义配置选项。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个工具。

## 更新日志

### v2.0.0
- 完全重构为Web界面，移除命令行工具
- 集成嵌入式登录功能，支持扫码登录
- 实现精确的清理前后统计功能
- 添加Cookie展示和复制功能
- 优化用户界面和交互体验

### v1.0.0
- 初始版本发布
- 支持Web界面和命令行两种使用方式
- 实现嵌入式登录功能
- 添加详细的统计和日志功能

## 相关项目

- [bilibili-qr-login](https://github.com/WittF/bilibili-qr-login) - 哔哩哔哩 Cookie 获取工具，本项目登录功能基于此项目实现

## 免责声明

使用本工具所产生的任何后果由用户自行承担，开发者不对因使用本工具造成的任何损失负责。本工具仅供学习和个人使用，请勿用于商业用途。
