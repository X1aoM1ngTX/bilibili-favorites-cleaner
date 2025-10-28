#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const https = require('https');
const querystring = require('querystring');

// 导入路由
const configRouter = require('./routes/config');
const favoritesRouter = require('./routes/favorites');
const cleanRouter = require('./routes/clean');
const convertRouter = require('./routes/convert');
const moveRouter = require('./routes/move');

// 创建Express应用
const app = express();

// 配置
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(morgan('combined')); // 日志记录
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api/config', configRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/clean', cleanRouter);
app.use('/api/convert-cookies', convertRouter);
app.use('/api/move', moveRouter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API接口不存在'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, HOST, () => {
  console.log(`🚀 服务器运行在 http://${HOST}:${PORT}`);
  console.log(`📊 健康检查: http://${HOST}:${PORT}/health`);
});

module.exports = app;