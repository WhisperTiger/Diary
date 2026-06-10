@echo off
echo === 云端同步日记应用部署脚本 ===
echo.

echo 1. 检查 Git 状态...
if not exist ".git" (
    echo   错误: 当前目录不是 Git 仓库
    echo   请先运行: git init
    goto :eof
)

echo 2. 添加所有文件到 Git...
git add .

echo 3. 提交更改...
set /p commit_message="请输入提交信息: "
if "%commit_message%"=="" set commit_message="更新代码"
git commit -m "%commit_message%"

echo 4. 推送到 GitHub...
echo   请确保已经设置远程仓库:
echo   git remote add origin https://github.com/WhisperTiger/diary.git
echo   git branch -M main
echo.
set /p continue_push="是否继续推送？(y/n): "

if /i "%continue_push%"=="y" (
    git push -u origin main
    echo.
    echo ^^^^ 代码已推送到 GitHub
) else (
    echo ^^^^ 跳过推送
)

echo.
echo === 部署步骤 ===
echo.
echo 请按照以下步骤完成部署：
echo.
echo 第一步：创建 GitHub 仓库
echo   1. 访问 https://github.com
echo   2. 登录账号 WhisperTiger
echo   3. 创建新仓库 diary
echo   4. 不要勾选 'Add a README file'
echo   5. 点击 Create repository
echo.
echo 第二步：启用 GitHub Pages
echo   1. 进入仓库：github.com/Whispertiger/diary
echo   2. 点击 Settings ^^^^ Pages
echo   3. Source: Deploy from a branch
echo   4. Branch: main, Folder: / (root)
echo   5. 点击 Save
echo.
echo 第三步：在 Vercel 部署后端
echo   1. 访问 https://vercel.com
echo   2. 用 GitHub 账号登录
echo   3. 点击 Add New Project
echo   4. 选择你的 diary 仓库
echo   5. 修改 Root Directory 为：server
echo   6. 点击 Deploy
echo.
echo 第四步：配置环境变量
echo   在 Vercel 项目 Settings ^^^^ Environment Variables 添加：
echo   - JWT_SECRET: 随机字符串（32位）
echo   - PORT: 3000
echo.
echo 第五步：更新前端配置
echo   1. 部署完成后获取 Vercel URL（如：https://diary-api.vercel.app）
echo   2. 修改 config.js 中的 API_URL
echo   3. 再次运行此脚本推送更新
echo.
echo === 完成部署 ===
echo.
echo 访问地址：https://whispertiger.github.io/diary/
echo 后端健康检查：https://diary-api.vercel.app/health
echo.
echo 使用方法：
echo   1. 打开前端页面
echo   2. 输入密码解密日记
echo   3. 注册账号（用户名：whispertiger，密码：Caihong0105）
echo   4. 开始使用云端同步日记

pause