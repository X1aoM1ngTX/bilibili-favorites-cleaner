# Bilibili Favorites Cleaner

B 站收藏夹管理工具，支持批量清理失效视频、移动视频、收藏夹排序。

## 功能

- **清理失效视频** — 批量选择收藏夹，一键清理其中的失效视频
- **移动视频** — 在收藏夹之间移动视频，自动计算容量，支持一键移动
- **收藏夹排序** — 拖拽调整收藏夹顺序
- **扫码登录** — 通过 B 站 APP 扫码或 Cookie 登录

## 技术栈

- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Zustand** 状态管理
- **Lucide React** 图标

## 快速开始

```bash
# 安装依赖
npm install

# 开发
npm run dev

# 构建
npm run build

# 生产运行
npm start
```

启动后访问 `http://localhost:3000`。

## 使用说明

1. **登录** — 打开页面后先通过扫码或 Cookie 登录 B 站账号
2. **清理失效视频** — 切换到「清理收藏夹」标签，勾选要清理的收藏夹，点击清理
3. **移动视频** — 切换到「移动视频」标签，选择源和目标收藏夹，勾选视频后移动
4. **排序收藏夹** — 切换到「收藏夹排序」标签，拖拽调整顺序后保存

## 项目结构

```
app/
  api/           # API 路由（clean, favorites, move, sort）
  globals.css    # 全局样式 + B站品牌主题
  layout.tsx     # 根布局
  page.tsx       # 主页面
components/
  ui/            # 基础组件（Button, Card, Tabs 等）
  clean-panel.tsx
  login-panel.tsx
  move-panel.tsx
  sort-panel.tsx
lib/
  bilibili-api.ts  # B站 API 封装
  utils.ts         # 工具函数
store/
  use-app-store.ts  # Zustand 全局状态
types/
  index.ts          # TypeScript 类型定义
```

## 许可

仅供学习交流使用。
