@echo off
echo ========================================
echo 多Agent基金投研平台 - 初始化脚本
echo ========================================
echo.

echo [1/5] 检查Python环境...
python --version
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.11+
    pause
    exit /b 1
)
echo.

echo [2/5] 创建虚拟环境...
if not exist venv (
    python -m venv venv
    echo 虚拟环境创建成功
) else (
    echo 虚拟环境已存在
)
echo.

echo [3/5] 激活虚拟环境并安装依赖...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo.

echo [4/5] 创建必要目录...
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist instance mkdir instance
echo 目录创建完成
echo.

echo [5/5] 复制环境变量文件...
if not exist .env (
    copy .env.example .env
    echo 已创建.env文件，请编辑该文件配置数据库连接
) else (
    echo .env文件已存在
)
echo.

echo ========================================
echo 初始化完成！
echo ========================================
echo.
echo 下一步操作:
echo 1. 编辑 .env 文件配置数据库连接
echo 2. 运行: flask init-db (初始化数据库)
echo 3. 运行: python run.py (启动服务)
echo.
pause
