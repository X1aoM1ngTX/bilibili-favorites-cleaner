@echo off
echo ========================================
echo   哔哩哔哩收藏夹清理工具 - 快速启动
echo ========================================
echo.

echo [1/4] 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js 14.0或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js环境正常

echo.
echo [2/4] 安装后端依赖...
cd backend
if not exist "node_modules" (
    echo 正在安装后端依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 后端依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ 后端依赖安装完成
) else (
    echo ✓ 后端依赖已安装
)
cd ..

echo.
echo [3/4] 安装前端依赖...
cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 前端依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ 前端依赖安装完成
) else (
    echo ✓ 前端依赖已安装
)
cd ..

echo.
echo [4/4] 启动服务...
echo 正在启动后端API服务和前端应用...
echo.
echo 后端服务: http://localhost:8080
echo 前端应用: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务
echo.

start "后端服务" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "前端应用" cmd /k "cd frontend && npm run serve"

echo.
echo 服务已启动，请查看新打开的命令行窗口
echo.
pause