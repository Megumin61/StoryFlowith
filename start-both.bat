@echo off
echo 启动StoryFlow应用和代理服务器...
echo.

echo 正在安装代理服务器依赖...
cd /d "%~dp0"
if not exist "node_modules" (
    echo 安装前端依赖...
    npm install
)

echo.
echo 正在启动代理服务器...
start "代理服务器" cmd /k "npm install express cors http-proxy-middleware && node proxy-server.js"

echo.
echo 等待代理服务器启动...
timeout /t 3 /nobreak > nul

echo.
echo 正在启动前端应用...
start "前端应用" cmd /k "npm start"

echo.
echo 两个服务都已启动！
echo 前端应用: http://localhost:3000
echo 代理服务器: http://localhost:3001
echo.
echo 按任意键退出...
pause > nul 