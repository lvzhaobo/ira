"""Flask扩展初始化"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# 数据库ORM
db = SQLAlchemy()

# 数据库迁移
migrate = Migrate()

# JWT认证
jwt = JWTManager()

# 跨域支持
cors = CORS()
