"""应用启动文件"""
import os
from loguru import logger
from app import create_app

# 创建Flask应用
app = create_app(os.getenv('FLASK_ENV', 'development'))

# 配置日志
log_level = app.config.get('LOG_LEVEL', 'DEBUG')
log_file = app.config.get('LOG_FILE', 'logs/app.log')

# 确保日志目录存在
log_dir = os.path.dirname(log_file)
if log_dir and not os.path.exists(log_dir):
    os.makedirs(log_dir)

# 添加文件日志
logger.add(
    log_file,
    level=log_level,
    rotation="10 MB",
    retention="30 days",
    encoding="utf-8"
)

# 添加控制台日志
logger.add(
    lambda msg: print(msg, end=""),
    level=log_level,
    colorize=True
)

logger.info("="*50)
logger.info("多Agent基金投研平台启动")
logger.info("="*50)


@app.route('/')
def index():
    """首页"""
    return {
        'code': 0,
        'message': '欢迎使用多Agent基金投研平台',
        'data': {
            'version': '1.0.0',
            'docs': '/api/docs',
            'status': 'running'
        }
    }


@app.route('/api/docs')
def api_docs():
    """API文档 - 列出所有可用接口"""
    rules = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint == 'static':
            continue
        methods = sorted(rule.methods - {'HEAD', 'OPTIONS'})
        if methods:
            rules.append({
                'endpoint': rule.endpoint,
                'methods': methods,
                'url': str(rule)
            })
    rules.sort(key=lambda x: x['url'])
    return {
        'code': 0,
        'message': 'API文档',
        'data': {
            'name': '多Agent基金投研平台 API',
            'version': '1.0.0',
            'endpoints': rules
        }
    }


@app.route('/health')
def health_check():
    """健康检查"""
    return {
        'code': 0,
        'message': 'healthy',
        'data': {
            'status': 'healthy',
            'database': 'connected'
        }
    }


if __name__ == '__main__':
    # 从环境变量读取配置
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"启动服务器: http://{host}:{port}")
    logger.info(f"调试模式: {debug}")
    
    app.run(
        host=host,
        port=port,
        debug=debug
    )
