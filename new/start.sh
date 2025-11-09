#!/bin/bash

echo "========================================"
echo "  哔哩哔哩收藏夹清理工具 - 快速启动"
echo "========================================"
echo

# 检查Node.js环境
echo "[1/4] 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js 14.0或更高版本"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js环境正常"

# 安装后端依赖
echo
echo "[2/4] 安装后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 后端依赖安装失败"
        exit 1
    fi
    echo "✓ 后端依赖安装完成"
else
    echo "✓ 后端依赖已安装"
fi
cd ..

# 安装前端依赖
echo
echo "[3/4] 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "正在安装前端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 前端依赖安装失败"
        exit 1
    fi
    echo "✓ 前端依赖安装完成"
else
    echo "✓ 前端依赖已安装"
fi
cd ..

# 启动服务
echo
echo "[4/4] 启动服务..."
echo "正在启动后端API服务和前端应用..."
echo
echo "后端服务: http://localhost:8080"
echo "前端应用: http://localhost:3000"
echo
echo "按 Ctrl+C 停止服务"
echo

# 启动后端服务（在后台运行）
echo "启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端服务启动
sleep 3

# 启动前端服务（在后台运行）
echo "启动前端应用..."
cd frontend
npm run serve &
FRONTEND_PID=$!
cd ..

echo
echo "服务已启动"
echo "后端进程ID: $BACKEND_PID"
echo "前端进程ID: $FRONTEND_PID"
echo
echo "使用以下命令停止服务:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo

# 等待用户输入以停止服务
read -p "按回车键停止所有服务..."

# 停止所有服务
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "服务已停止"