#!/bin/bash

echo "========================================"
echo "  哔哩哔哩收藏夹清理工具 - 快速启动"
echo "========================================"
echo

# 检查Node.js环境
echo "[1/3] 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js 14.0或更高版本"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js环境正常"

# 安装依赖
echo
echo "[2/3] 安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 依赖安装失败"
        exit 1
    fi
    echo "✓ 依赖安装完成"
else
    echo "✓ 依赖已安装"
fi

# 启动服务
echo
echo "[3/3] 启动服务..."
echo "正在启动后端API服务和前端应用..."
echo
echo "后端服务: http://localhost:8080"
echo "前端应用: http://localhost:3000"
echo
echo "按 Ctrl+C 停止服务"
echo

npm run dev